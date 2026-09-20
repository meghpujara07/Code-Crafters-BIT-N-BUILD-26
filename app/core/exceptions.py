# app/core/exceptions.py
"""Custom exception hierarchy and FastAPI handler registration.
All backend errors are raised as ApiError which is transformed into the
standard envelope defined in the architecture.
"""

from fastapi import Request
from fastapi.responses import JSONResponse

class ApiError(Exception):
    """Base class for API errors that carry an HTTP status, a code and a message.
    """

    def __init__(self, status: int, code: str, message: str, details: list[dict] | None = None):
        self.status = status
        self.code = code
        self.message = message
        self.details = details or []
        super().__init__(message)

def register_exception_handlers(app) -> None:
    """Register a global handler that converts ApiError into the envelope.
    The handler is attached to the FastAPI app instance.
    """

    @app.exception_handler(ApiError)
    async def api_error_handler(request: Request, exc: ApiError):
        return JSONResponse(
            status_code=exc.status,
            content={
                "success": False,
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                },
            },
        )
