@echo off
REM 건설 청구서 관리 시스템 - 간편 실행 스크립트
REM 이 스크립트를 더블클릭하면 애플리케이션이 자동으로 시작됩니다.

title 건설 청구서 관리 시스템
color 0A

echo ================================================
echo 🏗️  건설 청구서 관리 시스템
echo ================================================
echo.

REM 현재 디렉토리로 이동
cd /d "%~dp0"

REM Docker 설치 및 실행 확인
echo [1/4] Docker 확인 중...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker가 설치되어 있지 않거나 실행 중이지 않습니다.
    echo.
    echo 📋 해결 방법:
    echo    1. Docker Desktop을 설치하세요 (https://docker.com/products/docker-desktop)
    echo    2. Docker Desktop을 실행하세요
    echo    3. 이 스크립트를 다시 실행하세요
    echo.
    pause
    exit /b 1
)
echo ✅ Docker 확인 완료
echo.

REM 애플리케이션 시작
echo [2/4] 애플리케이션 시작 중...
docker-compose up -d
if errorlevel 1 (
    echo ❌ 애플리케이션 시작에 실패했습니다.
    echo.
    echo 📋 해결 방법:
    echo    1. Docker Desktop이 실행 중인지 확인하세요
    echo    2. 포트 3000이 다른 프로그램에 의해 사용 중인지 확인하세요
    echo    3. 컴퓨터를 재시작하고 다시 시도하세요
    echo.
    pause
    exit /b 1
)
echo ✅ 애플리케이션 시작 완료
echo.

REM 실행 상태 확인
echo [3/4] 실행 상태 확인 중...
timeout /t 3 /nobreak >nul
docker-compose ps
echo.

REM 웹 브라우저 자동 열기
echo [4/4] 웹 브라우저 열기...
timeout /t 2 /nobreak >nul
start http://localhost:3000

echo.
echo ================================================
echo 🎉 애플리케이션이 성공적으로 시작되었습니다!
echo ================================================
echo.
echo 🌐 웹 주소: http://localhost:3000
echo.
echo 📋 사용 방법:
echo    1. 건축주 관리 - 고객 정보 관리
echo    2. 작업 항목 관리 - 공사 작업 관리  
echo    3. 청구서 관리 - 청구서 생성 및 PDF 출력
echo.
echo 💡 도움말:
echo    - Excel 가져오기/내보내기로 대량 데이터 처리 가능
echo    - PDF 생성으로 청구서 인쇄 및 이메일 전송 가능
echo    - 모든 데이터는 브라우저에 임시 저장 (정기 백업 권장)
echo.
echo ⏹️  프로그램 종료: stop-application.bat 실행
echo 📖 자세한 사용법: Windows-설치가이드.md 참고
echo.
echo 창을 닫으려면 아무 키나 누르세요...
pause >nul