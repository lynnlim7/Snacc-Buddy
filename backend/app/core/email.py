from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType

from app.core.config import settings

mail_config = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_password_reset_email(email:str, reset_link:str):
    message = MessageSchema(
        subject="Reset your Snacc Buddy password",
        recipients=[email],
        body=f"""
        <p>Hello,</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="{reset_link}">Reset password</a></p>
        """,
        subtype=MessageType.html,
    )

    fm = FastMail(mail_config)
    await fm.send_message(message)