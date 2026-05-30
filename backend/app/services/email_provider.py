from fastapi_mail import FastMail, MessageSchema

from app.core.mail import mail_config


class EmailProvider:
    def __init__(self):
        self.client = FastMail(mail_config)

    async def send(self, message: MessageSchema) -> None:
        await self.client.send_message(message)


def get_email_provider() -> EmailProvider:
    return EmailProvider()
