from functools import lru_cache

from app.core.config import get_settings
from app.services.pinecone_service import PineconeService


@lru_cache
def get_pinecone_service() -> PineconeService:
    # Single service instance per process to reuse Pinecone client.
    return PineconeService(get_settings())
