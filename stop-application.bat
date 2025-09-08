@echo off
REM 건설 청구서 관리 시스템 - 종료 스크립트
REM 이 스크립트를 더블클릭하면 애플리케이션이 안전하게 종료됩니다.

title 건설 청구서 관리 시스템 - 종료
color 0C

echo ================================================
echo 🛑 건설 청구서 관리 시스템 종료
echo ================================================
echo.

REM 현재 디렉토리로 이동
cd /d "%~dp0"

REM 실행 중인 애플리케이션 확인
echo [1/3] 실행 중인 애플리케이션 확인...
docker-compose ps

REM 애플리케이션 종료
echo.
echo [2/3] 애플리케이션 종료 중...
docker-compose down
if errorlevel 1 (
    echo ❌ 애플리케이션 종료 중 오류가 발생했습니다.
    echo ⚠️  강제 종료를 시도합니다...
    docker-compose kill
    docker-compose rm -f
)
echo ✅ 애플리케이션 종료 완료

REM 리소스 정리 (선택사항)
echo.
echo [3/3] 리소스 정리 중...
docker system prune -f >nul 2>&1
echo ✅ 리소스 정리 완료

echo.
echo ================================================
echo ✅ 애플리케이션이 안전하게 종료되었습니다.
echo ================================================
echo.
echo 📋 정보:
echo    - 모든 컨테이너가 중지되었습니다
echo    - 사용하지 않는 Docker 리소스가 정리되었습니다
echo    - 다음에 start-application.bat을 실행하면 다시 시작됩니다
echo.
echo 💾 참고사항:
echo    데이터는 브라우저에 임시 저장되므로 정기적으로
echo    Excel 내보내기를 통해 백업하시기 바랍니다.
echo.
echo 창을 닫으려면 아무 키나 누르세요...
pause >nul