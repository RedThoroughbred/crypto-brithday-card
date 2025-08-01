#!/usr/bin/env python3
import psycopg2
from sqlalchemy import create_engine

# Your Neon connection string
neon_url = "postgres://neondb_owner:npg_Zo8AFw6TbgNz@ep-late-heart-aef75fup-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require"

try:
    # Test with psycopg2
    print("Testing psycopg2 connection...")
    conn = psycopg2.connect(neon_url)
    cursor = conn.cursor()
    cursor.execute("SELECT version()")
    version = cursor.fetchone()
    print(f"✅ psycopg2 connection successful! PostgreSQL version: {version[0]}")
    cursor.close()
    conn.close()

    # Test with SQLAlchemy
    print("Testing SQLAlchemy connection...")
    from sqlalchemy import text
    engine = create_engine(neon_url.replace("postgres://", "postgresql://"))
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1 as test"))
        test_value = result.fetchone()[0]
        print(f"✅ SQLAlchemy connection successful! Test query returned: {test_value}")

    print("\n🎉 All connection tests passed! Neon PostgreSQL is ready.")

except Exception as e:
    print(f"❌ Connection failed: {e}")
    print("Please check your connection string and network access.")