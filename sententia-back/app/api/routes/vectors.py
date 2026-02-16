from fastapi import APIRouter, Depends

from app.dependencies import get_pinecone_service
from app.schemas.vector import VectorQueryRequest, VectorQueryResponse, VectorUpsertRequest
from app.services.pinecone_service import PineconeService

router = APIRouter(prefix="/vectors", tags=["vectors"])


@router.post("/upsert")
def upsert_vector(
    payload: VectorUpsertRequest,
    pinecone: PineconeService = Depends(get_pinecone_service),
) -> dict[str, str]:
    return pinecone.upsert_vector(
        vector_id=payload.id,
        values=payload.values,
        metadata=payload.metadata,
    )


@router.post("/query", response_model=VectorQueryResponse)
def query_vector(
    payload: VectorQueryRequest,
    pinecone: PineconeService = Depends(get_pinecone_service),
) -> VectorQueryResponse:
    matches = pinecone.query_vector(
        vector=payload.vector,
        top_k=payload.top_k,
        include_metadata=payload.include_metadata,
    )
    return VectorQueryResponse(matches=matches)
