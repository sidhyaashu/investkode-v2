import pytest
import json
import httpx
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_health_check(client):
    """Happy Path: Verify health check works."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_metrics_exposure(client):
    """Happy Path: Verify metrics endpoint is exposed."""
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "http_requests_total" in response.text

@pytest.mark.asyncio
async def test_proxy_success(client, mock_http_client):
    """Happy Path: Verify successful proxying."""
    # Mock upstream response
    mock_resp = httpx.Response(200, content=b"{\"success\": true}", headers={"Content-Type": "application/json"})
    mock_http_client.request.return_value = mock_resp

    # No user_id (anonymous)
    response = client.get("/api/v1/auth/health")
    
    assert response.status_code == 200
    assert response.json()["success"] is True
    mock_http_client.request.assert_called_once()

@pytest.mark.asyncio
async def test_gzip_compression(client, mock_http_client):
    """Happy Path: Verify GZip compression for large responses."""
    # Create a response > 1000 bytes
    large_data = "x" * 2000
    mock_resp = httpx.Response(200, content=large_data.encode(), headers={"Content-Type": "text/plain"})
    mock_http_client.request.return_value = mock_resp

    response = client.get("/api/v1/market/data", headers={"Accept-Encoding": "gzip"})
    
    assert response.status_code == 200
    assert response.headers["Content-Encoding"] == "gzip"

@pytest.mark.asyncio
async def test_route_not_found(client):
    """Unhappy Path: Verify 404 for non-existent route prefixes."""
    response = client.get("/api/v1/unknown-service/endpoint")
    assert response.status_code == 404
    assert "Route not found" in response.text

@pytest.mark.asyncio
async def test_rate_limiting_triggered(client, mock_redis):
    """Unhappy Path: Verify 429 when rate limit is exceeded."""
    # Mock redis.incr to return a value above the limit
    mock_redis.incr.return_value = 1000  # Above most limits
    
    response = client.get("/api/v1/auth/health")
    
    assert response.status_code == 429
    assert "Too Many Requests" in response.text

@pytest.mark.asyncio
async def test_ip_banning(client, mock_redis):
    """Unhappy Path: Verify 403 for blacklisted IPs."""
    # Mock redis.exists to return True for the blacklist key
    mock_redis.exists.return_value = True
    
    response = client.get("/api/v1/auth/health")
    
    assert response.status_code == 403
    assert "temporarily banned" in response.text

@pytest.mark.asyncio
async def test_circuit_breaker_open(client, mock_redis):
    """Unhappy Path: Verify 503 when circuit breaker is OPEN."""
    # Mock redis.get for {service}:open to return "true"
    mock_redis.get.return_value = "true"
    
    response = client.get("/api/v1/auth/health")
    
    assert response.status_code == 503
    assert "unavailable (Circuit Open)" in response.text

@pytest.mark.asyncio
async def test_upstream_timeout(client, mock_http_client):
    """Unhappy Path: Verify 504 on upstream timeout."""
    mock_http_client.request.side_effect = httpx.TimeoutException("Timeout")
    
    response = client.get("/api/v1/auth/health")
    
    assert response.status_code == 504
    assert "timeout" in response.text

@pytest.mark.asyncio
async def test_upstream_error_500(client, mock_http_client):
    """Unhappy Path: Verify 500 mapping from upstream."""
    mock_resp = httpx.Response(500, content=b"Internal Server Error")
    mock_http_client.request.return_value = mock_resp
    
    response = client.get("/api/v1/auth/health")
    
    assert response.status_code == 500


@pytest.mark.asyncio
async def test_auth_failure(client):
    """Unhappy Path: Verify 401 when authentication fails."""
    # We mock the validators to simulate a failure
    with patch("app.middleware.auth.validate_api_key", AsyncMock(return_value=None)), \
         patch("app.middleware.auth.validate_jwt", AsyncMock(side_effect=httpx.HTTPStatusError("401", request=None, response=None))):
        
        # This endpoint requires auth in routing.py
        response = client.get("/api/v1/user/profile")
        # In current middleware, it catches exceptions and returns JSONResponse
        assert response.status_code == 401
