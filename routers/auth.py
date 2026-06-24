from fastapi import APIRouter, Depends, status

from dependencies.auth import get_current_user
from schemas.auth import AuthResponse, UserLoginRequest, UserRegisterRequest, UserResponse
from services.security import create_access_token
from services.user_service import authenticate_user, create_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_account(payload: UserRegisterRequest):
    user = create_user(payload.email, payload.password)
    access_token = create_access_token(user["id"])
    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLoginRequest):
    user = authenticate_user(payload.email, payload.password)
    access_token = create_access_token(user["id"])
    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=UserResponse)
def get_profile(current_user: dict = Depends(get_current_user)):
    return current_user
