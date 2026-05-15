import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.repository.redis import redis_client

@pytest.fixture
def client():
    """Returns a TestClient for the FastAPI app."""
    return TestClient(app)

@pytest.fixture(autouse=True)
async def mock_redis():
    """Mocks the Redis client for all tests."""
    with patch("app.repository.redis.redis_client", new_callable=AsyncMock) as mocked:
        # Default mock behaviors
        mocked.get.return_value = None
        mocked.exists.return_value = False
        mocked.incr.return_value = 1
        yield mocked

@pytest.fixture(autouse=True)
def mock_http_client():
    """Mocks the upstream HTTP client."""
    with patch("app.core.http_client.http_client.client") as mocked:
        yield mocked
