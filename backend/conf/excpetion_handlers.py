from fastapi.exceptions import HTTPException, RequestValidationError
from pydantic import ValidationError
from tortoise.contrib.fastapi import tortoise_exception_handlers

from conf.responses import (
    CustomJSONResponse,
    custom_http_exception_handler,
    custom_request_validation_exception_handler,
    custom_validation_error_handler,
)


async def request_validation_exception_handler(request, exc):
    """Custom handler for request validation exceptions."""
    return await custom_request_validation_exception_handler(request, exc)


async def http_exception_handler(request, exc):
    """Custom handler for HTTP exceptions."""
    return await custom_http_exception_handler(request, exc)


async def validator_error_handler(request, exc):
    """Custom handler for validation errors."""
    return await custom_validation_error_handler(request, exc)


async def custom_exception_handler(_request, exc):
    """Custom handler for general exceptions."""
    response_data = {"message": "Exception Raised", "details": str(exc)}
    return CustomJSONResponse(content=response_data, status_code=500)


exception_handlers = {
    **tortoise_exception_handlers(),
    RequestValidationError: custom_request_validation_exception_handler,
    HTTPException: custom_http_exception_handler,
    ValidationError: custom_validation_error_handler,
    Exception: custom_exception_handler,
}
