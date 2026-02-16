from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.dependencies import get_pinecone_service
from app.main import create_app
from app.services.pinecone_service import MAX_UPLOAD_FILE_SIZE_BYTES


@pytest.fixture
def app():
    test_app = create_app()
    yield test_app
    test_app.dependency_overrides.clear()


def _build_client(app, service) -> TestClient:
    app.dependency_overrides[get_pinecone_service] = lambda: service
    return TestClient(app)


def test_upload_file_success(app) -> None:
    mock_service = SimpleNamespace(
        sanitize_filename=Mock(return_value="documento.pdf"),
        upload_assistant_file=Mock(
            return_value={
                "file_id": "file-123",
                "name": "documento.pdf",
                "size": 1200,
                "status": "Processing",
                "message": "Archivo cargado y en procesamiento por Pinecone Assistant.",
            }
        ),
    )
    client = _build_client(app, mock_service)

    response = client.post(
        "/api/v1/assistant/files/upload",
        headers={"X-Request-Id": "req-upload-success"},
        files={"file": ("documento.pdf", b"%PDF-1.4 contenido", "application/pdf")},
    )

    assert response.status_code == 200
    assert response.json() == {
        "file_id": "file-123",
        "name": "documento.pdf",
        "size": 1200,
        "status": "Processing",
        "message": "Archivo cargado y en procesamiento por Pinecone Assistant.",
    }
    mock_service.sanitize_filename.assert_called_once_with("documento.pdf")
    mock_service.upload_assistant_file.assert_called_once()


def test_upload_file_duplicate(app) -> None:
    mock_service = SimpleNamespace(
        sanitize_filename=Mock(return_value="documento.pdf"),
        upload_assistant_file=Mock(
            side_effect=HTTPException(
                status_code=409,
                detail="Ya existe un archivo con el nombre 'documento.pdf'.",
            )
        ),
    )
    client = _build_client(app, mock_service)

    response = client.post(
        "/api/v1/assistant/files/upload",
        headers={"X-Request-Id": "req-upload-duplicate"},
        files={"file": ("documento.pdf", b"%PDF-1.4 contenido", "application/pdf")},
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Ya existe un archivo con el nombre 'documento.pdf'."
    mock_service.upload_assistant_file.assert_called_once()


def test_upload_file_invalid_extension(app) -> None:
    mock_service = SimpleNamespace(
        sanitize_filename=Mock(return_value="documento.txt"),
        upload_assistant_file=Mock(),
    )
    client = _build_client(app, mock_service)

    response = client.post(
        "/api/v1/assistant/files/upload",
        headers={"X-Request-Id": "req-upload-invalid"},
        files={"file": ("documento.txt", b"contenido texto", "text/plain")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Solo se permiten archivos .pdf."
    mock_service.upload_assistant_file.assert_not_called()


def test_upload_file_size_exceeded(app) -> None:
    mock_service = SimpleNamespace(
        sanitize_filename=Mock(return_value="grande.pdf"),
        upload_assistant_file=Mock(),
    )
    client = _build_client(app, mock_service)
    big_file = b"a" * (MAX_UPLOAD_FILE_SIZE_BYTES + 1)

    response = client.post(
        "/api/v1/assistant/files/upload",
        headers={"X-Request-Id": "req-upload-big"},
        files={"file": ("grande.pdf", big_file, "application/pdf")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "El archivo supera el limite de 10MB."
    mock_service.upload_assistant_file.assert_not_called()
