class AIException(Exception):
    """Base for all AI service errors."""


class AIQuotaExceeded(AIException):
    """Daily free-tier quota exhausted. Do not retry until tomorrow."""


class AIRateLimited(AIException):
    """Per-minute request limit hit. Safe to retry after a short delay."""

    def __init__(self, retry_after: float = 10.0) -> None:
        self.retry_after = retry_after
        super().__init__(f"Rate limited. Retry after {retry_after}s.")


class AIParseError(AIException):
    """AI returned a response that failed JSON / schema validation."""


class AIServiceError(AIException):
    """Unexpected or unrecoverable error from the AI provider."""


class AITimeoutError(AIException):
    """Gemini did not respond within the configured timeout."""


class AIDuplicateRequest(AIException):
    """Identical image is already being processed — prevents double spend."""
