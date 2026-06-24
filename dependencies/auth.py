from fastapi import HTTPException, Request, status

from services.user_service import get_user_by_id


def get_current_user(request: Request) -> dict:
    auth_error = getattr(request.state, "auth_error", None)
    if auth_error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=auth_error)

    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account was not found.",
        )

    return user
