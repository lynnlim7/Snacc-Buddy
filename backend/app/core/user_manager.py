import uuid
import structlog
from typing import Optional

from fastapi import Depends, Request
from fastapi_users import BaseUserManager, UUIDIDMixin
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.config import settings
from app.models.user import User
from app.services.notification import NotificationService, get_notification_service

logger = structlog.get_logger()


class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = settings.RESET_PASSWORD_TOKEN_SECRET
    verification_token_secret = settings.VERIFICATION_TOKEN_SECRET

    def __init__(self, user_db, notification_service: NotificationService):
        super().__init__(user_db)
        self.notification_service = notification_service

    async def on_after_register(self, user: User, request: Optional[Request] = None):
        logger.info("user_registered", user_id=str(user.id), email=user.email)
        try:
            await self.notification_service.send_signup_confirmation_email(user.email)
        except Exception as exc:
            logger.warning("signup_email_failed", user_id=str(user.id), error=str(exc))

    async def on_after_forgot_password(self, user: User, token: str, request: Optional[Request] = None):
        reset_link = f"{settings.FRONTEND_RESET_PASSWORD_URL}?token={token}"
        await self.notification_service.send_password_reset_email(user.email, reset_link)
        logger.info("password_reset_email_sent", user_id=str(user.id))


async def get_user_db(session: AsyncSession = Depends(get_db)):
    yield SQLAlchemyUserDatabase(session, User)


async def get_user_manager(
    user_db: SQLAlchemyUserDatabase = Depends(get_user_db),
    notification_service: NotificationService = Depends(get_notification_service),
):
    yield UserManager(user_db, notification_service)
