from __future__ import annotations

import logging
import re
from io import BytesIO
from pathlib import Path
from typing import Any

from fastapi import HTTPException, status
from pinecone import Pinecone

from app.core.config import Settings
from app.schemas.assistant import AssistantEnsureRequest, ChatRequest

MAX_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024
ALLOWED_UPLOAD_EXTENSION = ".pdf"

logger = logging.getLogger(__name__)
_FILENAME_SANITIZER = re.compile(r"[^A-Za-z0-9._-]+")


def sanitize_filename(filename: str | None) -> str:
    """
    Remove path traversal and unsafe characters from client-provided file names.
    """
    raw_name = (filename or "").strip()
    base_name = Path(raw_name).name
    sanitized = _FILENAME_SANITIZER.sub("_", base_name).strip("._")
    return sanitized


def normalize_assistant_file_status(raw_status: str | None) -> str:
    """
    Map provider status values to API-stable values expected by clients.
    """
    status_value = (raw_status or "").strip().lower()
    if "avail" in status_value or status_value in {"ready", "completed"}:
        return "Available"
    return "Processing"


def normalize_assistant_response(raw_response: Any) -> dict[str, Any]:
    """
    Normalize Pinecone Assistant output into the API ChatResponse contract.

    Responsibilities:
    - Clean answer text.
    - Group/dedupe references by file.
    - Merge and dedupe cited pages.
    - Build deterministic confidence and usage payloads.
    - Return "no evidence" fallback when citations are empty.
    """

    def _clean_text(value: str | None) -> str:
        # Collapse multiline/extra whitespace into a single clean sentence block.
        return " ".join((value or "").split()).strip()

    usage = getattr(raw_response, "usage", None)
    usage_payload = {
        "prompt_tokens": int(getattr(usage, "prompt_tokens", 0) or 0),
        "completion_tokens": int(getattr(usage, "completion_tokens", 0) or 0),
        "total_tokens": int(getattr(usage, "total_tokens", 0) or 0),
    }

    source_map: dict[str, dict[str, Any]] = {}
    citations = getattr(raw_response, "citations", []) or []
    for citation in citations:
        for reference in getattr(citation, "references", []) or []:
            file_obj = getattr(reference, "file", None)
            file_name = getattr(file_obj, "name", None) or getattr(file_obj, "id", None) or "unknown"

            pages = []
            for page in getattr(reference, "pages", []) or []:
                try:
                    pages.append(int(page))
                except (TypeError, ValueError):
                    continue

            highlight = getattr(reference, "highlight", None)
            excerpt = _clean_text(getattr(highlight, "content", None)) if highlight else ""

            if file_name not in source_map:
                source_map[file_name] = {"file": file_name, "pages": set(), "excerpt": ""}

            source_map[file_name]["pages"].update(pages)
            if excerpt and not source_map[file_name]["excerpt"]:
                source_map[file_name]["excerpt"] = excerpt

    sources = []
    for source in source_map.values():
        sources.append(
            {
                "file": source["file"],
                "pages": sorted(source["pages"]),
                "excerpt": source["excerpt"],
            }
        )

    if not sources:
        return {
            "answer": "No se encontró soporte documental suficiente en los archivos.",
            "sources": [],
            "confidence": "low",
            "usage": usage_payload,
        }

    answer_text = _clean_text(getattr(getattr(raw_response, "message", None), "content", "")) or (
        "No se encontró soporte documental suficiente en los archivos."
    )

    # Simple confidence heuristic based on number of independent documentary sources.
    if len(sources) >= 3:
        confidence = "high"
    else:
        confidence = "medium"

    return {
        "answer": answer_text,
        "sources": sources,
        "confidence": confidence,
        "usage": usage_payload,
    }


class PineconeService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        # Client is created lazily from env config and reused by DI cache.
        self._client = Pinecone(api_key=settings.pinecone_api_key) if settings.pinecone_api_key else None

    @property
    def is_ready(self) -> bool:
        return bool(self._client and self._settings.pinecone_runtime_assistant_name)

    def _ensure_ready(self) -> None:
        if not self._settings.pinecone_api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Pinecone no configurado. Falta PINECONE_API_KEY.",
            )
        if not self._settings.pinecone_runtime_assistant_name:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Pinecone Assistant no configurado. Falta PINECONE_ASSISTANT_NAME.",
            )

    def _handle_pinecone_error(self, exc: Exception) -> None:
        # Normalize SDK exceptions into stable API-level HTTP errors.
        name = exc.__class__.__name__
        if name == "NotFoundException":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No existe el assistant '{self._settings.pinecone_runtime_assistant_name}' en Pinecone.",
            ) from exc
        if name in {"UnauthorizedException", "ForbiddenException"}:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No autorizado en Pinecone. Revisa PINECONE_API_KEY.",
            ) from exc
        if name in {"BadRequestException", "PineconeApiTypeError", "PineconeApiValueError"}:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Solicitud rechazada por Pinecone Assistant ({name}).",
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error al comunicarse con Pinecone Assistant ({name}).",
        ) from exc

    @staticmethod
    def sanitize_filename(filename: str | None) -> str:
        # Reused by route-level validation and response sanitization.
        return sanitize_filename(filename)

    def _assistant(self) -> Any:
        # Resolve assistant handle per request after config checks.
        self._ensure_ready()
        try:
            return self._client.assistant.Assistant(self._settings.pinecone_runtime_assistant_name)
        except Exception as exc:  # pragma: no cover - mapped to API errors
            self._handle_pinecone_error(exc)

    def assistant_status(self) -> dict[str, Any]:
        assistant = self._assistant()
        return {
            "name": assistant.name,
            "status": assistant.status,
            "instructions": assistant.instructions,
            "metadata": assistant.metadata or {},
        }

    def ensure_assistant(self, payload: AssistantEnsureRequest) -> dict[str, Any]:
        self._ensure_ready()
        name = self._settings.pinecone_runtime_assistant_name

        # If assistant already exists, return it without mutating state.
        try:
            assistant = self._client.assistant.Assistant(name)
            return {
                "name": assistant.name,
                "status": assistant.status,
                "created": False,
                "instructions": assistant.instructions,
                "metadata": assistant.metadata or {},
            }
        except Exception as exc:
            if exc.__class__.__name__ != "NotFoundException":
                self._handle_pinecone_error(exc)

        # Otherwise bootstrap a new assistant so the API is immediately usable.
        region = payload.region or self._settings.pinecone_assistant_region
        instructions = payload.instructions or "You are a legal assistant. Respond clearly and cite sources when available."
        metadata = payload.metadata or {}

        try:
            assistant = self._client.assistant.create_assistant(
                assistant_name=name,
                instructions=instructions,
                metadata=metadata,
                region=region,
            )
        except Exception as exc:  # pragma: no cover - mapped to API errors
            self._handle_pinecone_error(exc)

        return {
            "name": assistant.name,
            "status": assistant.status,
            "created": True,
            "instructions": assistant.instructions,
            "metadata": assistant.metadata or {},
        }

    def assistant_files(self) -> list[dict[str, Any]]:
        assistant = self._assistant()
        try:
            files = assistant.list_files()
        except Exception as exc:  # pragma: no cover - mapped to API errors
            self._handle_pinecone_error(exc)

        return [
            {
                "id": file.id,
                "name": file.name,
                "status": file.status,
                "metadata": file.metadata or {},
                "created_on": file.created_on,
                "updated_on": file.updated_on,
            }
            for file in files
        ]

    def upload_assistant_file(self, *, file_name: str, file_bytes: bytes, request_id: str) -> dict[str, Any]:
        """
        Upload a single PDF into Pinecone Assistant after duplicate-name protection.
        """
        assistant = self._assistant()
        safe_name = sanitize_filename(file_name)
        file_size = len(file_bytes)

        logger.info(
            "assistant_upload_started request_id=%s file_name=%s file_size=%d",
            request_id,
            safe_name,
            file_size,
        )

        # Enforce duplicate check by normalized file name before we upload.
        try:
            existing_files = assistant.list_files()
        except Exception as exc:  # pragma: no cover - mapped to API errors
            self._handle_pinecone_error(exc)

        safe_name_lower = safe_name.lower()
        for existing_file in existing_files:
            existing_name = sanitize_filename(getattr(existing_file, "name", ""))
            if existing_name.lower() == safe_name_lower:
                logger.warning(
                    "assistant_upload_duplicate request_id=%s file_name=%s file_size=%d",
                    request_id,
                    safe_name,
                    file_size,
                )
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Ya existe un archivo con el nombre '{safe_name}'.",
                )

        try:
            uploaded_file = assistant.upload_bytes_stream(
                stream=BytesIO(file_bytes),
                file_name=safe_name,
                timeout=-1,
            )
        except Exception as exc:  # pragma: no cover - mapped to API errors
            self._handle_pinecone_error(exc)

        normalized_status = normalize_assistant_file_status(getattr(uploaded_file, "status", None))
        returned_file_id = str(getattr(uploaded_file, "id", "") or "").strip()
        returned_name = sanitize_filename(getattr(uploaded_file, "name", None)) or safe_name

        raw_size = getattr(uploaded_file, "size", None)
        try:
            returned_size = int(raw_size)
            if returned_size < 0:
                returned_size = file_size
        except (TypeError, ValueError):
            returned_size = file_size

        message = (
            "Archivo cargado y disponible para consultas."
            if normalized_status == "Available"
            else "Archivo cargado y en procesamiento por Pinecone Assistant."
        )

        logger.info(
            "assistant_upload_success request_id=%s file_id=%s file_name=%s file_size=%d status=%s",
            request_id,
            returned_file_id,
            returned_name,
            returned_size,
            normalized_status,
        )

        return {
            "file_id": returned_file_id,
            "name": returned_name,
            "size": returned_size,
            "status": normalized_status,
            "message": message,
        }

    def chat(self, payload: ChatRequest) -> dict[str, Any]:
        assistant = self._assistant()
        messages = [{"role": "user", "content": payload.question}]

        # Only forward context options when explicitly defined.
        context_options: dict[str, Any] = {}
        if payload.top_k is not None:
            context_options["top_k"] = payload.top_k

        try:
            raw_response = assistant.chat(
                messages=messages,
                model=self._settings.pinecone_assistant_model,
                temperature=0.0,
                context_options=context_options or None,
                include_highlights=True,
            )
        except Exception as exc:  # pragma: no cover - mapped to API errors
            self._handle_pinecone_error(exc)

        normalized = normalize_assistant_response(raw_response)

        # Strict mode enforces fallback behavior when no documentary evidence exists.
        if payload.strict and not normalized["sources"]:
            normalized["answer"] = "No se encontró soporte documental suficiente en los archivos."
            normalized["confidence"] = "low"

        return normalized
