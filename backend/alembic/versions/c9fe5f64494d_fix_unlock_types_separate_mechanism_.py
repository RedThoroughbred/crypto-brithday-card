"""fix unlock types - separate mechanism from reward content

Revision ID: c9fe5f64494d
Revises: 7cb8bc4d67df
Create Date: 2025-07-29 20:12:02.737885

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9fe5f64494d'
down_revision: Union[str, None] = '7cb8bc4d67df'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Update unlock_type enum to match chain system (7 types)
    op.execute("ALTER TYPE unlocktype RENAME TO unlocktype_old")
    op.execute("CREATE TYPE unlocktype AS ENUM ('GPS', 'VIDEO', 'IMAGE', 'MARKDOWN', 'QUIZ', 'PASSWORD', 'URL')")
    
    # Remove default first
    op.execute("ALTER TABLE gifts ALTER COLUMN unlock_type DROP DEFAULT")
    
    # First convert column to text temporarily 
    op.execute("ALTER TABLE gifts ALTER COLUMN unlock_type TYPE TEXT")
    
    # Update existing data to convert old types to new types
    op.execute("""
        UPDATE gifts 
        SET unlock_type = CASE 
            WHEN unlock_type = 'URL' THEN 'URL'
            WHEN unlock_type = 'MESSAGE' THEN 'MARKDOWN'
            ELSE 'GPS'
        END
    """)
    
    # Update the gifts column to use new enum
    op.execute("ALTER TABLE gifts ALTER COLUMN unlock_type TYPE unlocktype USING unlock_type::TEXT::unlocktype")
    
    # Add back the default for gifts
    op.execute("ALTER TABLE gifts ALTER COLUMN unlock_type SET DEFAULT 'GPS'::unlocktype")
    
    # Also update chain_steps table if it exists
    op.execute("ALTER TABLE chain_steps ALTER COLUMN unlock_type DROP DEFAULT")
    op.execute("ALTER TABLE chain_steps ALTER COLUMN unlock_type TYPE TEXT")
    op.execute("""
        UPDATE chain_steps 
        SET unlock_type = CASE 
            WHEN unlock_type = 'URL' THEN 'URL'
            WHEN unlock_type = 'MESSAGE' THEN 'MARKDOWN'
            ELSE 'GPS'
        END
    """)
    op.execute("ALTER TABLE chain_steps ALTER COLUMN unlock_type TYPE unlocktype USING unlock_type::TEXT::unlocktype")
    op.execute("ALTER TABLE chain_steps ALTER COLUMN unlock_type SET DEFAULT 'GPS'::unlocktype")
    
    # Drop old enum
    op.execute("DROP TYPE unlocktype_old")
    
    # Rename unlock_data to unlock_challenge_data (stores password, quiz question/answer, etc.)
    op.alter_column('gifts', 'unlock_data', new_column_name='unlock_challenge_data')
    
    # Add reward_content field for what unlocks WITH the funds
    op.add_column('gifts', sa.Column('reward_content', sa.Text(), nullable=True))
    op.add_column('gifts', sa.Column('reward_content_type', sa.String(50), nullable=True))


def downgrade() -> None:
    # Remove new columns
    op.drop_column('gifts', 'reward_content_type')
    op.drop_column('gifts', 'reward_content')
    
    # Rename back
    op.alter_column('gifts', 'unlock_challenge_data', new_column_name='unlock_data')
    
    # Revert enum
    op.execute("ALTER TYPE unlocktype RENAME TO unlocktype_old")
    op.execute("CREATE TYPE unlocktype AS ENUM ('GPS', 'URL', 'MESSAGE')")
    op.execute("ALTER TABLE gifts ALTER COLUMN unlock_type TYPE unlocktype USING 'GPS'::unlocktype")
    op.execute("DROP TYPE unlocktype_old")
