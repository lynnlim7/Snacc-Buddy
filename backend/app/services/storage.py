import asyncio
import logging
import uuid

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from app.core.config import settings

logger = logging.getLogger(__name__)

PRESIGNED_URL_EXPIRY_SECONDS = 3600  # 1 hour


class R2StorageService:
    """
    Uploads food images to a private Cloudflare R2 bucket (S3-compatible).

    Objects are never publicly accessible. Access is granted via short-lived
    presigned URLs generated on demand (default: 1 hour).

    Falls back gracefully when credentials are not configured — the analyze
    endpoint still works, images just won't persist across sessions.
    """

    def __init__(self) -> None:
        self._client = None
        if self._is_configured:
            self._client = boto3.client(
                "s3",
                endpoint_url=f"https://{settings.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
                aws_access_key_id=settings.CLOUDFLARE_R2_ACCESS_KEY_ID,
                aws_secret_access_key=settings.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
                region_name="auto",
            )

    @property
    def _is_configured(self) -> bool:
        return bool(
            settings.CLOUDFLARE_R2_ACCOUNT_ID
            and settings.CLOUDFLARE_R2_ACCESS_KEY_ID
            and settings.CLOUDFLARE_R2_SECRET_ACCESS_KEY
            and settings.CLOUDFLARE_R2_BUCKET_NAME
        )

    async def upload_image(self, image_bytes: bytes, mime_type: str) -> str | None:
        """
        Upload image bytes to R2 and return the object key.

        The key (not a URL) is what gets stored in the database.
        Call get_presigned_url(key) to generate a time-limited URL for display.

        Returns None if R2 is not configured or the upload fails.
        """
        if not self._is_configured or self._client is None:
            logger.debug("r2_storage.upload skipped — R2 not configured")
            return None

        ext = mime_type.split("/")[-1].replace("jpeg", "jpg")
        key = f"food-images/{uuid.uuid4()}.{ext}"

        def _put() -> None:
            self._client.put_object(  # type: ignore[union-attr]
                Bucket=settings.CLOUDFLARE_R2_BUCKET_NAME,
                Key=key,
                Body=image_bytes,
                ContentType=mime_type,
            )

        try:
            await asyncio.to_thread(_put)
            logger.info("r2_storage.upload ok key=%s", key)
            return key
        except (BotoCoreError, ClientError) as exc:
            logger.error("r2_storage.upload failed key=%s error=%s", key, exc)
            return None

    def get_presigned_url(
        self,
        key: str,
        expiry_seconds: int = PRESIGNED_URL_EXPIRY_SECONDS,
    ) -> str | None:
        """
        Generate a presigned GET URL for a private R2 object.

        Signing is a local HMAC operation — no network call is made.
        The URL expires after `expiry_seconds` (default 1 hour).

        Returns None if R2 is not configured or signing fails.
        """
        if not self._is_configured or self._client is None:
            return None
        try:
            return self._client.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": settings.CLOUDFLARE_R2_BUCKET_NAME,
                    "Key": key,
                },
                ExpiresIn=expiry_seconds,
            )
        except (BotoCoreError, ClientError) as exc:
            logger.error("r2_storage.presign failed key=%s error=%s", key, exc)
            return None


r2_storage = R2StorageService()
