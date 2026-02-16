from typing import Any, Literal

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    # User question to be sent to Pinecone Assistant.
    question: str = Field(min_length=1)
    # Optional retrieval depth override for context snippets.
    top_k: int | None = Field(default=None, ge=1, le=64)
    # If strict=True, we enforce "no evidence => no generated answer".
    strict: bool = True


class Source(BaseModel):
    # Human-readable file name used as documentary support.
    file: str
    # Deduplicated page numbers linked to the answer.
    pages: list[int] = Field(default_factory=list)
    # Short supporting fragment (if provided by assistant highlights).
    excerpt: str = ""


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source] = Field(default_factory=list)
    confidence: str
    usage: dict[str, int] = Field(default_factory=dict)


class AssistantStatusResponse(BaseModel):
    name: str
    status: str
    instructions: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class AssistantFileResponse(BaseModel):
    id: str
    name: str
    status: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_on: str
    updated_on: str


class AssistantEnsureRequest(BaseModel):
    instructions: str | None = None
    region: Literal["us", "eu"] | None = None
    metadata: dict[str, Any] | None = None


class AssistantEnsureResponse(BaseModel):
    name: str
    status: str
    created: bool
    instructions: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class AssistantFileUploadResponse(BaseModel):
    # Pinecone file identifier generated after successful upload.
    file_id: str
    # Sanitized file name stored in the assistant.
    name: str
    # Uploaded file size in bytes.
    size: int = Field(ge=0)
    # Normalized lifecycle status for clients.
    status: str
    # Human-readable status message for UI/consumer logs.
    message: str
