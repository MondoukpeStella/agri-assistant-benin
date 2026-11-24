"""Initial schema without business tables.

Revision ID: 20261124_0001
Revises:
Create Date: 2026-11-24

"""

revision = "20261124_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Keep the schema empty until a persistence decision exists."""


def downgrade() -> None:
    """Nothing was created."""
