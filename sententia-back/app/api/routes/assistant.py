from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status

from app.dependencies import get_pinecone_service
from app.schemas.assistant import (
    AssistantEnsureRequest,
    AssistantEnsureResponse,
    AssistantFileResponse,
    AssistantFileUploadResponse,
    AssistantStatusResponse,
    ChatRequest,
    ChatResponse,
)
from app.services.pinecone_service import ALLOWED_UPLOAD_EXTENSION, MAX_UPLOAD_FILE_SIZE_BYTES, PineconeService

router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.post("/ensure", response_model=AssistantEnsureResponse)
def assistant_ensure(
    payload: AssistantEnsureRequest,
    pinecone: PineconeService = Depends(get_pinecone_service),
) -> AssistantEnsureResponse:
    # Bootstrap endpoint: creates assistant only when missing.
    return AssistantEnsureResponse(**pinecone.ensure_assistant(payload))


@router.get("/status", response_model=AssistantStatusResponse)
def assistant_status(
    pinecone: PineconeService = Depends(get_pinecone_service),
) -> AssistantStatusResponse:
    # Health/status info from Pinecone Assistant control plane.
    return AssistantStatusResponse(**pinecone.assistant_status())


@router.get("/files", response_model=list[AssistantFileResponse])
def assistant_files(
    pinecone: PineconeService = Depends(get_pinecone_service),
) -> list[AssistantFileResponse]:
    # Lists files already indexed by the assistant.
    return [AssistantFileResponse(**item) for item in pinecone.assistant_files()]


@router.post("/files/upload", response_model=AssistantFileUploadResponse)
async def assistant_upload_file(
    request: Request,
    file: UploadFile = File(...),
    pinecone: PineconeService = Depends(get_pinecone_service),
) -> AssistantFileUploadResponse:
    # Use incoming request ID when available so logs can be traced end-to-end.
    request_id = (request.headers.get("x-request-id") or str(uuid4())).strip()
    sanitized_name = pinecone.sanitize_filename(file.filename)

    if not sanitized_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nombre de archivo invalido.",
        )
    if not sanitized_name.lower().endswith(ALLOWED_UPLOAD_EXTENSION):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se permiten archivos .pdf.",
        )

    try:
        content = await file.read()
        file_size = len(content)

        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El archivo esta vacio.",
            )
        if file_size > MAX_UPLOAD_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El archivo supera el limite de 10MB.",
            )

        payload = pinecone.upload_assistant_file(
            file_name=sanitized_name,
            file_bytes=content,
            request_id=request_id,
        )
        return AssistantFileUploadResponse(**payload)
    finally:
        await file.close()


@router.post("/chat", response_model=ChatResponse)
def assistant_chat(
    payload: ChatRequest,
    pinecone: PineconeService = Depends(get_pinecone_service),
) -> ChatResponse:
    # Main query endpoint used by client applications.
    return ChatResponse(**pinecone.chat(payload))
