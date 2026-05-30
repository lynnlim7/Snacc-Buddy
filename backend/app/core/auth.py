import uuid

from fastapi_users import FastAPIUsers
from fastapi_users.authentication import BearerTransport, JWTStrategy, AuthenticationBackend

from app.core.config import settings
from app.core.user_manager import get_user_manager
from app.models.user import User

# transport handler
bearer_transport = BearerTransport(tokenUrl="/auth/jwt/login")

# token generation
def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(
        secret=settings.JWT_SECRET, 
        lifetime_seconds=settings.JWT_LIFETIME_SECONDS
        )

# authentication workflow handler
auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

fastapi_users = FastAPIUsers[User, uuid.UUID](
    get_user_manager,
    [auth_backend],
)

current_admin_user = (
    fastapi_users.current_user(
        active=True, 
        superuser=True
    )
)
