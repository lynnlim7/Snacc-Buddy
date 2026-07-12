import httpx
from fastapi_mail import MessageSchema

from app.core.config import settings

_RESEND_API_URL = "https://api.resend.com/emails"


class EmailProvider:
    async def send(self, message: MessageSchema) -> None:
        payload = {
            "from": f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>",
            "to": [str(r) for r in message.recipients],
            "subject": message.subject,
            "html": str(message.body),
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(
                _RESEND_API_URL,
                json=payload,
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                timeout=15,
            )
            response.raise_for_status()


def get_email_provider() -> EmailProvider:
    return EmailProvider()
