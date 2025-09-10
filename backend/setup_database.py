#!/usr/bin/env python3
"""
Supabase 데이터베이스 설정 및 테이블 생성 스크립트
"""
import sys
import os
import subprocess
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def run_alembic_migration():
    """Alembic을 사용해서 데이터베이스 테이블 생성"""
    try:
        print("🚀 Alembic으로 데이터베이스 마이그레이션 시작...")
        
        # 현재 디렉토리를 backend로 변경
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
        
        # Alembic 마이그레이션 실행
        result = subprocess.run([
            sys.executable, "-m", "alembic", "upgrade", "head"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ 데이터베이스 테이블 생성 성공!")
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
        else:
            print("❌ 마이그레이션 실패!")
            print(f"💥 오류: {result.stderr}")
            return False
            
    except Exception as e:
        print("❌ 마이그레이션 실행 중 오류!")
        print(f"💥 오류: {e}")
        return False

def main():
    print("🏗️ Supabase 데이터베이스 설정 시작...")
    print("=" * 50)
    
    # 1. 연결 테스트
    from test_connection import test_connection
    if not test_connection():
        print("\n❌ 연결 실패로 인해 설정을 중단합니다.")
        return False
    
    print("\n" + "=" * 50)
    
    # 2. 마이그레이션 실행
    if run_alembic_migration():
        print("\n🎉 Supabase 데이터베이스 설정 완료!")
        print("💡 이제 백엔드 서버를 시작할 수 있습니다:")
        print("   cd backend && python run_server.py")
        return True
    else:
        print("\n❌ 데이터베이스 설정 실패!")
        return False

if __name__ == "__main__":
    main()