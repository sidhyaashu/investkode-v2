import pytest
import json
import httpx
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_edge_caching_logic(client, mock_http_client, mock_redis):
    """Happy Path: Verify GET requests are cached and subsequent requests use cache."""
    
    # 1. First request: Mock upstream 200 and Redis cache miss
    mock_resp = httpx.Response(200, content=b"{\"market\": \"open\"}", headers={"Content-Type": "application/json"})
    mock_http_client.request.return_value = mock_resp
    mock_redis.get.return_value = None # Cache miss
    
    # Hit a cacheable route
    response1 = client.get("/api/v1/market/status")
    
    assert response1.status_code == 200
    assert response1.json()["market"] == "open"
    mock_http_client.request.assert_called_once()
    # Verify it was saved to Redis
    mock_redis.set.assert_called()

    # 2. Second request: Mock Redis cache hit
    mock_http_client.request.reset_mock()
    cache_data = {
        "body": "{\"market\": \"open\"}",
        "status": 200,
        "headers": {"content-type": "application/json"}
    }
    mock_redis.get.return_value = json.dumps(cache_data)
    
    response2 = client.get("/api/v1/market/status")
    
    assert response2.status_code == 200
    assert response2.json()["market"] == "open"
    # Upstream should NOT be called
    mock_http_client.request.assert_not_called()

@pytest.mark.asyncio
async def test_no_cache_for_post(client, mock_http_client, mock_redis):
    """Verify POST requests are never cached."""
    mock_resp = httpx.Response(200, content=b"{\"success\": true}")
    mock_http_client.request.return_value = mock_resp
    
    response = client.post("/api/v1/market/status")
    
    assert response.status_code == 200
    mock_redis.get.assert_not_called()
    mock_redis.set.assert_not_called()
