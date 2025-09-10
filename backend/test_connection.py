#!/usr/bin/env python3
"""
Supabase 데이터베이스 연결 테스트 스크립트
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from sqlalchemy import text

def test_connection():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            print("✅ Supabase PostgreSQL 연결 성공!")
            print(f"📊 PostgreSQL 버전: {version}")
            return True
    except Exception as e:
        print("❌ 데이터베이스 연결 실패!")
        print(f"💥 오류: {e}")
        print("\n🔧 해결 방법:")
        print("1. .env 파일의 DATABASE_URL이 올바른지 확인")
        print("2. Supabase 대시보드에서 연결 정보 재확인")
        print("3. 네트워크 연결 상태 확인")
        return False

if __name__ == "__main__":
    print("🔍 Supabase 연결 테스트 시작...")
    test_connection()