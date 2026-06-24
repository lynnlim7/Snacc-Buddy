from datetime import datetime
from pathlib import Path

from fastapi import Depends
from fastapi_mail import MessageSchema, MessageType
from jinja2 import Environment, FileSystemLoader

from app.services.email_provider import EmailProvider, get_email_provider

_templates_dir = Path(__file__).parent.parent / "templates"
_jinja_env = Environment(loader=FileSystemLoader(str(_templates_dir)), autoescape=True)


def _render(template_name: str, **kwargs) -> str:
    return _jinja_env.get_template(template_name).render(year=datetime.now().year, **kwargs)


class NotificationService:
    def __init__(self, email_provider: EmailProvider):
        self.email_provider = email_provider

    async def send_signup_confirmation_email(
        self, email: str, name: str | None = None
    ) -> None:
        message = MessageSchema(
            subject="Welcome to Snacc Buddy! 🍿",
            recipients=[email],
            body=_render("welcome.html", name=name),
            subtype=MessageType.html,
        )
        await self.email_provider.send(message)

    async def send_verify_email(
        self, email: str, verify_link: str, name: str | None = None
    ) -> None:
        message = MessageSchema(
            subject="Please verify your Snacc Buddy email",
            recipients=[email],
            body=_render("verify_email.html", name=name, verify_link=verify_link),
            subtype=MessageType.html,
        )
        await self.email_provider.send(message)

    async def send_password_reset_email(
        self, email: str, reset_link: str, name: str | None = None
    ) -> None:
        message = MessageSchema(
            subject="Reset your Snacc Buddy password",
            recipients=[email],
            body=_render("password_reset.html", name=name, reset_link=reset_link),
            subtype=MessageType.html,
        )
        await self.email_provider.send(message)


def get_notification_service(
    email_provider: EmailProvider = Depends(get_email_provider),
) -> NotificationService:
    return NotificationService(email_provider)
