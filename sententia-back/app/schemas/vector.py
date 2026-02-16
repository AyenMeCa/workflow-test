from typing import Any

from pydantic import BaseModel, Field


class VectorUpsertRequest(BaseModel):
    id: str = Field(min_length=1)
    values: list[float] = Field(min_length=1)
    metadata: dict[str, Any] | None = None


class VectorQueryRequest(BaseModel):
    vector: list[float] = Field(min_length=1)
    top_k: int = Field(default=5, ge=1, le=100)
    include_metadata: bool = True


class VectorMatch(BaseModel):
    id: str
    score: float
    metadata: dict[str, Any] | None = None


class VectorQueryResponse(BaseModel):
    matches: list[VectorMatch]
