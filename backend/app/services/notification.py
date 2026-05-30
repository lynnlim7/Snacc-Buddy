from fastapi import Depends
from fastapi_mail import MessageSchema, MessageType

from app.services.email_provider import EmailProvider, get_email_provider


class NotificationService:
    def __init__(self, email_provider: EmailProvider):
        self.email_provider = email_provider

    async def send_signup_confirmation_email(self, email: str) -> None:
        message = MessageSchema(
            subject="Welcome to Snacc Buddy",
            recipients=[email],
            body=f"""
                <p>Hello,</p>
                <p>Thank you for signing up.</p>
            """,
            subtype=MessageType.html,
        )
        await self.email_provider.send(message)

    async def send_password_reset_email(self, email: str, reset_link: str) -> None:
        message = MessageSchema(
            subject="Reset your Snacc Buddy password",
            recipients=[email],
            body=f"""
                <p>Hello,</p>
                <p>Click the link below to reset your password:</p>
                <a href="{reset_link}">Reset Password</a>
            """,
            subtype=MessageType.html,
        )
        await self.email_provider.send(message)


def get_notification_service(
    email_provider: EmailProvider = Depends(get_email_provider),
) -> NotificationService:
    return NotificationService(email_provider)