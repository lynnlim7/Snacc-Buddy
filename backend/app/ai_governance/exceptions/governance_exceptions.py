from uuid import UUID


class GovernanceException(Exception):
    """Base for all AI governance domain exceptions."""


# ── Model Registry ────────────────────────────────────────────────────────────

class ModelNotFoundError(GovernanceException):
    def __init__(self, model_id: UUID) -> None:
        super().__init__(f"AI model '{model_id}' not found.")
        self.model_id = model_id


class ModelIdentifierConflictError(GovernanceException):
    """Raised when model_identifier + version already exists."""


class RetiredModelCannotBeDefaultError(GovernanceException):
    def __init__(self, model_id: UUID) -> None:
        super().__init__(
            f"Model '{model_id}' is retired and cannot be set as the default."
        )
        self.model_id = model_id


class NoDefaultModelError(GovernanceException):
    def __init__(self) -> None:
        super().__init__(
            "No default AI model is registered. "
            "Register and activate a model before running inferences."
        )


# ── Prompt Registry ───────────────────────────────────────────────────────────

class PromptNotFoundError(GovernanceException):
    def __init__(self, prompt_id: UUID) -> None:
        super().__init__(f"Prompt version '{prompt_id}' not found.")
        self.prompt_id = prompt_id


class ActivePromptImmutableError(GovernanceException):
    def __init__(self, prompt_id: UUID) -> None:
        super().__init__(
            f"Active prompt '{prompt_id}' is immutable. "
            "Create a new prompt version to make changes."
        )
        self.prompt_id = prompt_id


class NoActivePromptError(GovernanceException):
    def __init__(self, model_id: UUID) -> None:
        super().__init__(
            f"No active prompt found for model '{model_id}'. "
            "Activate a prompt version before running inferences."
        )
        self.model_id = model_id


# ── Inference Audit ───────────────────────────────────────────────────────────

class InferenceLogNotFoundError(GovernanceException):
    def __init__(self, log_id: UUID) -> None:
        super().__init__(f"Inference log '{log_id}' not found.")
        self.log_id = log_id


# ── Human Review ──────────────────────────────────────────────────────────────

class ReviewAlreadyExistsError(GovernanceException):
    def __init__(self, inference_id: UUID) -> None:
        super().__init__(
            f"A human review already exists for inference '{inference_id}'."
        )
        self.inference_id = inference_id


class InvalidReviewDecisionError(GovernanceException):
    def __init__(self, value: str) -> None:
        super().__init__(
            f"'{value}' is not a valid review decision. "
            "Use: APPROVED, REVIEW_REQUIRED, or REJECTED."
        )
        self.value = value
