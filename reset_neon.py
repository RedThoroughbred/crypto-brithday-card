#!/usr/bin/env python3
from sqlalchemy import create_engine, text
import os

# Neon connection string
neon_url = "postgresql://neondb_owner:npg_Zo8AFw6TbgNz@ep-late-heart-aef75fup-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"

try:
    engine = create_engine(neon_url)
    
    with engine.connect() as conn:
        # Drop all tables to start fresh
        print("🗑️ Dropping all tables...")
        result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"))
        tables = [row[0] for row in result.fetchall()]
        
        for table in tables:
            conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE;"))
            print(f"   Dropped {table}")
        
        # Drop alembic_version if it exists
        conn.execute(text("DROP TABLE IF EXISTS alembic_version CASCADE;"))
        print("   Dropped alembic_version")
        
        conn.commit()
        print("✅ Neon database reset successfully!")
        
except Exception as e:
    print(f"❌ Reset failed: {e}")