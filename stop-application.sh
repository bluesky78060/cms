#!/bin/bash
# 건설 청구서 관리 시스템 - Mac/Linux 종료 스크립트

echo "================================================"
echo "⏹️  건설 청구서 관리 시스템 - 종료"
echo "================================================"
echo

# 현재 디렉토리로 이동
cd "$(dirname "$0")"

# 애플리케이션 종료
echo "애플리케이션 종료 중..."
docker-compose down

echo "✅ 애플리케이션이 종료되었습니다."
echo
echo "🔄 다시 시작하려면: ./start-application.sh"
echo

read -p "종료하려면 Enter를 누르세요..."