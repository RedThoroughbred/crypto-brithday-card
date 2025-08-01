#!/usr/bin/env python3
from sqlalchemy import create_engine, inspect
import os

# Neon connection string
neon_url = "postgresql://neondb_owner:npg_Zo8AFw6TbgNz@ep-late-heart-aef75fup-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"

try:
    engine = create_engine(neon_url)
    inspector = inspect(engine)
    
    tables = inspector.get_table_names()
    print(f"✅ Tables found in Neon database: {len(tables)}")
    
    for table in sorted(tables):
        columns = inspector.get_columns(table)
        print(f"  📋 {table}: {len(columns)} columns")
    
    print("\n🎉 Neon database structure verified successfully!")
    
except Exception as e:
    print(f"❌ Verification failed: {e}")