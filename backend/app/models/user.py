from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from backend.app.core.database import Base

class User(SQLAlchemyBaseUserTableUUID, Base):
    """
    Inherits from fastapi-users base.
    """
    pass