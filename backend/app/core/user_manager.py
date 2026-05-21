import uuid
from typing import Optional

from fastapi import Depends, Request
from fastapi_users import BaseUserManager, UUIDIDMixin
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.email import send_password_reset_email
from app.core.database import get_db
from app.core.config import settings
from app.models.user import User


class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = settings.RESET_PASSWORD_TOKEN_SECRET
    verification_token_secret = settings.VERIFICATION_TOKEN_SECRET

    async def on_after_register(self, user: User, request: Optional[Request] = None):
        print(f"User {user.id} ({user.email}) has registered.")

    async def on_after_forgot_password(self, user: User, token: str, request: Optional[Request] = None):
        reset_link = f"{settings.FRONTEND_RESET_PASSWORD_URL}?token={token}"
        await send_password_reset_email(user.email, reset_link)
        print(f"User {user.id} forgot password. Reset link sent.")


async def get_user_db(session: AsyncSession = Depends(get_db)):
    yield SQLAlchemyUserDatabase(session, User)


async def get_user_manager(user_db: SQLAlchemyUserDatabase = Depends(get_user_db)):
    yield UserManager(user_db)

         
