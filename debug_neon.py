#!/usr/bin/env python3
from sqlalchemy import create_engine, text
import os

# Neon connection string
neon_url = "postgresql://neondb_owner:npg_Zo8AFw6TbgNz@ep-late-heart-aef75fup-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"

try:
    engine = create_engine(neon_url)
    
    with engine.connect() as conn:
        # Check if we can see any tables at all
        result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"))
        tables = result.fetchall()
        print(f"Tables in public schema: {[row[0] for row in tables]}")
        
        # Check alembic version table
        try:
            result = conn.execute(text("SELECT * FROM alembic_version;"))
            version = result.fetchone()
            print(f"Alembic version: {version[0] if version else 'None'}")
        except Exception as e:
            print(f"No alembic_version table: {e}")
            
        # Check current database
        result = conn.execute(text("SELECT current_database();"))
        db = result.fetchone()[0]
        print(f"Current database: {db}")
        
except Exception as e:
    print(f"❌ Debug failed: {e}")