@echo off
REM 건설 청구서 관리 시스템 - Docker 빌드 및 패키징 스크립트
REM 이 스크립트는 프로젝트를 Docker 이미지로 빌드하고 배포용으로 패키징합니다.

echo ================================================
echo 건설 청구서 관리 시스템 - 배포용 패키징
echo ================================================

REM 현재 디렉토리 확인
echo.
echo [1/6] 현재 디렉토리 확인 중...
cd /d "%~dp0"
echo 현재 위치: %CD%

REM Docker 실행 상태 확인
echo.
echo [2/6] Docker 상태 확인 중...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker가 설치되어 있지 않거나 실행 중이지 않습니다.
    echo    Docker Desktop을 설치하고 실행한 후 다시 시도해주세요.
    pause
    exit /b 1
)
echo ✅ Docker가 정상적으로 실행 중입니다.

REM 기존 컨테이너 중지 및 제거
echo.
echo [3/6] 기존 컨테이너 정리 중...
docker-compose down -v 2>nul
docker system prune -f >nul 2>&1
echo ✅ 기존 컨테이너 정리 완료

REM Docker 이미지 빌드
echo.
echo [4/6] Docker 이미지 빌드 중... (이 과정은 몇 분이 소요될 수 있습니다)
docker-compose build --no-cache
if errorlevel 1 (
    echo ❌ Docker 이미지 빌드에 실패했습니다.
    echo    오류 내용을 확인하고 다시 시도해주세요.
    pause
    exit /b 1
)
echo ✅ Docker 이미지 빌드 완료

REM 컨테이너 시작
echo.
echo [5/6] 애플리케이션 시작 중...
docker-compose up -d
if errorlevel 1 (
    echo ❌ 애플리케이션 시작에 실패했습니다.
    pause
    exit /b 1
)
echo ✅ 애플리케이션이 성공적으로 시작되었습니다.

REM 배포 이미지 저장 (선택사항)
echo.
echo [6/6] 배포용 이미지 저장 중...
for /f "tokens=1" %%i in ('docker-compose ps -q') do set CONTAINER_ID=%%i
if not "%CONTAINER_ID%"=="" (
    docker commit %CONTAINER_ID% construction-management-system:latest
    docker save -o construction-management-system.tar construction-management-system:latest
    echo ✅ 배포용 이미지가 'construction-management-system.tar' 파일로 저장되었습니다.
) else (
    echo ⚠️  컨테이너를 찾을 수 없어 배포 이미지 저장을 건너뜁니다.
)

echo.
echo ================================================
echo 🎉 패키징 완료!
echo ================================================
echo.
echo ✅ 웹 브라우저에서 http://localhost:3000 으로 접속하여 확인하세요.
echo.
echo 📦 배포 파일들:
echo    - docker-compose.yml (필수)
echo    - Dockerfile (필수)  
echo    - nginx.conf (필수)
echo    - construction-management-system.tar (선택사항)
echo    - Windows-설치가이드.md (사용자 가이드)
echo.
echo 💡 다른 컴퓨터에 설치하려면:
echo    1. 위 파일들을 복사하고
echo    2. Windows-설치가이드.md를 참고하여 설치하세요.
echo.
pause