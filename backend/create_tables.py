#!/usr/bin/env python3
"""
Supabase에 직접 테이블을 생성하는 스크립트
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
from app.models import (
    clients, projects, work_logs, work_items, 
    labor_entries, equipment_entries, material_entries,
    invoices, invoice_lines, reference_data
)

def create_all_tables():
    """모든 테이블 생성"""
    try:
        print("🏗️ Supabase에 테이블 생성 중...")
        
        # 모든 테이블 생성
        Base.metadata.create_all(bind=engine)
        
        print("✅ 데이터베이스 테이블 생성 완료!")
        print("📋 생성된 테이블:")
        print("   - clients (고객)")
        print("   - projects (프로젝트)")
        print("   - work_logs (작업 로그)")
        print("   - work_items (작업 항목)")
        print("   - labor_entries (노무 투입)")
        print("   - equipment_entries (장비 투입)")
        print("   - material_entries (자재 투입)")
        print("   - invoices (청구서)")
        print("   - invoice_lines (청구서 라인)")
        print("   - reference_data (참조 데이터)")
        
        return True
        
    except Exception as e:
        print("❌ 테이블 생성 실패!")
        print(f"💥 오류: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Supabase 테이블 생성 시작...")
    print("=" * 50)
    
    # 연결 테스트
    from test_connection import test_connection
    if not test_connection():
        print("\n❌ 연결 실패로 인해 테이블 생성을 중단합니다.")
        sys.exit(1)
    
    print("\n" + "=" * 50)
    
    # 테이블 생성
    if create_all_tables():
        print("\n🎉 Supabase 데이터베이스 설정 완료!")
        print("💡 이제 백엔드 서버를 시작할 수 있습니다:")
        print("   python3 run_server.py")
    else:
        print("\n❌ 데이터베이스 설정 실패!")
        sys.exit(1)