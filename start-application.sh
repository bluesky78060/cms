#!/bin/bash
# 건설 청구서 관리 시스템 - Mac/Linux 실행 스크립트

echo "================================================"
echo "🏗️  건설 청구서 관리 시스템"
echo "================================================"
echo

# 현재 디렉토리로 이동
cd "$(dirname "$0")"

# Docker 설치 및 실행 확인
echo "[1/4] Docker 확인 중..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker가 설치되어 있지 않거나 실행 중이지 않습니다."
    echo
    echo "📋 해결 방법:"
    echo "   1. Docker Desktop을 설치하세요 (https://docker.com/products/docker-desktop)"
    echo "   2. Docker Desktop을 실행하세요"
    echo "   3. 이 스크립트를 다시 실행하세요"
    echo
    read -p "계속하려면 Enter를 누르세요..."
    exit 1
fi
echo "✅ Docker 확인 완료"
echo

# 애플리케이션 시작
echo "[2/4] 애플리케이션 시작 중... (첫 실행시 시간이 오래 걸릴 수 있습니다)"
if ! docker-compose up -d; then
    echo "❌ 애플리케이션 시작에 실패했습니다."
    echo
    echo "📋 해결 방법:"
    echo "   1. Docker Desktop이 실행 중인지 확인하세요"
    echo "   2. 포트 3000이 다른 프로그램에 의해 사용 중인지 확인하세요"
    echo "   3. 터미널에서 'docker-compose logs'를 실행하여 오류 확인"
    echo
    read -p "계속하려면 Enter를 누르세요..."
    exit 1
fi
echo "✅ 애플리케이션 시작 완료"
echo

# 실행 상태 확인
echo "[3/4] 실행 상태 확인 중..."
sleep 3
docker-compose ps
echo

# 웹 브라우저 자동 열기
echo "[4/4] 웹 브라우저 열기..."
sleep 2
if command -v open &> /dev/null; then
    open http://localhost:3000
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
else
    echo "브라우저를 수동으로 열어 http://localhost:3000 에 접속하세요"
fi

echo
echo "================================================"
echo "🎉 애플리케이션이 성공적으로 시작되었습니다!"
echo "================================================"
echo
echo "🌐 웹 주소: http://localhost:3000"
echo
echo "📋 사용 방법:"
echo "   1. 건축주 관리 - 고객 정보 관리"
echo "   2. 작업 항목 관리 - 공사 작업 관리"
echo "   3. 청구서 관리 - 청구서 생성 및 PDF 출력"
echo
echo "💡 도움말:"
echo "   - Excel 가져오기/내보내기로 대량 데이터 처리 가능"
echo "   - PDF 생성으로 청구서 인쇄 및 이메일 전송 가능"
echo "   - 모든 데이터는 브라우저에 임시 저장 (정기 백업 권장)"
echo
echo "⏹️  프로그램 종료: ./stop-application.sh 실행"
echo "📖 자세한 사용법: README.md 참고"
echo
read -p "종료하려면 Enter를 누르세요..."