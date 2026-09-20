"""initial CloudOps schema
Revision ID: 0001_initial
"""
from alembic import op
from app.db.base import Base
from app.db import models
revision='0001_initial'; down_revision=None; branch_labels=None; depends_on=None
def upgrade():
    bind=op.get_bind(); Base.metadata.create_all(bind=bind)
def downgrade():
    bind=op.get_bind(); Base.metadata.drop_all(bind=bind)
