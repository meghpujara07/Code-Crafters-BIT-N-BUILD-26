"""C4 decision-plane indexes."""
from alembic import op

revision = "0002_c4_action_indexes"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("DROP INDEX IF EXISTS uq_recommendations_resource_type")
    op.execute("ALTER TABLE recommendations DROP CONSTRAINT IF EXISTS uq_recommendations_resource_type")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS uq_actions_resource_inflight ON actions (resource_id) WHERE status IN ('PENDING_APPROVAL','APPROVED','EXECUTING')")


def downgrade():
    op.execute("DROP INDEX IF EXISTS uq_actions_resource_inflight")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS uq_recommendations_resource_type ON recommendations (resource_id, type)")
