@echo off
REM 건설 청구서 관리 시스템 - Windows 네이티브 실행 (Docker 없이)
REM Node.js가 설치되어 있어야 합니다.

title 건설 청구서 관리 시스템 - Native 실행
color 0B

echo ================================================
echo 🏗️  건설 청구서 관리 시스템 (Native 실행)
echo ================================================
echo.

REM 현재 디렉토리로 이동
cd /d "%~dp0"

REM Node.js 설치 확인
echo [1/4] Node.js 확인 중...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js가 설치되어 있지 않습니다.
    echo.
    echo 📋 해결 방법:
    echo    1. https://nodejs.org 에서 Node.js를 다운로드하세요
    echo    2. LTS 버전을 설치하세요 (권장: 18.x 또는 20.x)
    echo    3. 컴퓨터를 재시작하세요
    echo    4. 이 스크립트를 다시 실행하세요
    echo.
    pause
    exit /b 1
)
echo ✅ Node.js 확인 완료
echo.

REM frontend 폴더로 이동
cd frontend

REM 의존성 설치 확인
echo [2/4] 의존성 패키지 확인 중...
if not exist "node_modules" (
    echo 📦 필요한 패키지들을 설치합니다... (시간이 걸릴 수 있습니다)
    npm install
    if errorlevel 1 (
        echo ❌ 패키지 설치에 실패했습니다.
        echo 인터넷 연결을 확인하고 다시 시도하세요.
        pause
        exit /b 1
    )
) else (
    echo ✅ 패키지 확인 완료
)
echo.

REM 포트 사용 중인지 확인
echo [3/4] 포트 3000 확인 중...
netstat -ano | findstr :3000 >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  포트 3000이 이미 사용 중입니다.
    echo 다른 프로그램을 종료하거나 포트를 변경하세요.
    pause
)
echo ✅ 포트 확인 완료
echo.

REM 애플리케이션 시작
echo [4/4] 애플리케이션 시작 중...
echo.
echo ================================================
echo 🎉 애플리케이션이 시작됩니다!
echo ================================================
echo.
echo 🌐 웹 주소: http://localhost:3000
echo ⏹️  종료: Ctrl + C를 누르세요
echo.
echo 📋 사용 방법:
echo    1. 건축주 관리 - 고객 정보 관리
echo    2. 작업 항목 관리 - 공사 작업 관리
echo    3. 청구서 관리 - 청구서 생성 및 PDF 출력
echo.
echo 💡 도움말:
echo    - 브라우저가 자동으로 열리지 않으면 http://localhost:3000을 직접 입력하세요
echo    - 모든 데이터는 브라우저에 저장됩니다 (정기 백업 권장)
echo    - Excel 가져오기/내보내기 기능으로 데이터를 관리하세요
echo.

REM 브라우저 자동 열기 (3초 후)
timeout /t 3 /nobreak >nul
start http://localhost:3000

REM React 개발 서버 시작
npm start