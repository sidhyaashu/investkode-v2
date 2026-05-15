import time
from typing import Any, Dict, Optional
from fastapi.responses import JSONResponse


def success_response(
    data: Any = None,
    message: str = "Success",
    meta: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    return {
        "success": True,
        "message": message,
        "data": data if data is not None else {},
        "meta": meta or {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
    }


def error_response(
    code: str,
    message: str,
    status_code: int = 400,
    meta: Optional[Dict[str, Any]] = None
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": {
                "code": code,
                "message": message
            },
            "meta": meta or {
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            }
        }
    )