import uuid
from typing import Optional

from fastapi import Depends, Request
from fastapi_users import BaseUserManager, UUIDIDMixim
from fastapi_users.db import SQLAlchemyUserDatabase
from fastapi_users.ext.asycio import AsyncSession

from app.core.database import get_db
from app.models.user import User

class UserManager(UUIDIDMixim, BaseUserManager[User, uuid.UUID]):
    async def on_after_register(self, user, request: Optional[Request]=None):
        print(f"User {user.id} ({user.email}) has registered.")

    async def on_after_forgot_password(self, user, token: str, request: Optional[Request]=None):
        # TODO: send email with reset link containing the token
        print(f"User {user.id} forgot password. Reset token: {token}")

    async def get_user_db(session: AsyncSession = Depends(get_db)):
        yield SQLAlchemyUserDatabase(session, user)

    async def get_user_manager(user_db: SQLAlchemyUserDatabase = Depends(get_db)):
        yield UserManager(user_db)

        
