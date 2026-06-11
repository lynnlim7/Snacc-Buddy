import enum


class InferenceStatus(str, enum.Enum):
    SUCCESS = "success"
    FAILED = "failed"
    CACHE_HIT = "cache_hit"
    TIMEOUT = "timeout"
    PARSE_ERROR = "parse_error"
