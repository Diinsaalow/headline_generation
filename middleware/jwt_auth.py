from jose import JWTError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from services.security import decode_access_token


class JWTAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request.state.user_id = None
        request.state.auth_error = None

        authorization = request.headers.get("Authorization")
        if authorization:
            scheme, _, token = authorization.partition(" ")
            if scheme.lower() != "bearer" or not token:
                request.state.auth_error = "Invalid authorization header."
            else:
                try:
                    payload = decode_access_token(token)
                    request.state.user_id = str(payload["sub"])
                except JWTError:
                    request.state.auth_error = "Invalid or expired token."

        return await call_next(request)
