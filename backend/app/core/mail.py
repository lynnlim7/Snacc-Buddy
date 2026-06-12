from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType

from app.core.config import settings

import os as _os

# MAIL_SUPPRESS_SEND=1 silently drops all outgoing email (smoke tests / local dev).
_suppress = _os.getenv("MAIL_SUPPRESS_SEND", "0") == "1"

mail_config = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=not _suppress,
    VALIDATE_CERTS=not _suppress,
    SUPPRESS_SEND=_suppress,
)

