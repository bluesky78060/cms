@echo off
REM 프로젝트 폴더 정리 스크립트
REM 불필요한 폴더와 파일들을 삭제하여 배포 크기를 줄입니다.

title 프로젝트 폴더 정리
color 0E

echo ================================================
echo 🧹 건설 청구서 관리 시스템 - 폴더 정리
echo ================================================
echo.
echo ⚠️  이 스크립트는 다음 항목들을 삭제합니다:
echo    - node_modules 폴더 (1.2GB)
echo    - build 폴더 (빌드 결과물)
echo    - 중복된 construction-management-system 폴더
echo    - 빈 폴더들 및 시스템 파일
echo.
echo 💡 삭제된 폴더들은 필요시 다음과 같이 복원할 수 있습니다:
echo    - node_modules: 'npm install' 실행
echo    - build: 'npm run build' 실행
echo.

set /p confirm="계속하시겠습니까? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo 취소되었습니다.
    pause
    exit /b 0
)

echo.
echo [1/7] 현재 디렉토리 확인...
cd /d "%~dp0"
echo 현재 위치: %CD%

echo.
echo [2/7] node_modules 폴더 삭제 중... (시간이 걸릴 수 있습니다)
if exist "frontend\node_modules" (
    rmdir /s /q "frontend\node_modules" 2>nul
    echo ✅ frontend\node_modules 삭제 완료
) else (
    echo ℹ️  frontend\node_modules 폴더가 없습니다
)

echo.
echo [3/7] build 폴더 삭제 중...
if exist "frontend\build" (
    rmdir /s /q "frontend\build" 2>nul
    echo ✅ frontend\build 삭제 완료
) else (
    echo ℹ️  frontend\build 폴더가 없습니다
)

echo.
echo [4/7] 중복된 construction-management-system 폴더 삭제 중...
if exist "construction-management-system" (
    rmdir /s /q "construction-management-system" 2>nul
    echo ✅ 중복 폴더 삭제 완료
) else (
    echo ℹ️  중복 폴더가 없습니다
)

echo.
echo [5/7] 빈 폴더들 삭제 중...
if exist "frontend\nano_banana_output" (
    rmdir /s /q "frontend\nano_banana_output" 2>nul
    echo ✅ nano_banana_output 삭제 완료
)

echo.
echo [6/7] 시스템 파일들 삭제 중...
del /s /q ".DS_Store" 2>nul
if exist ".claude" (
    rmdir /s /q ".claude" 2>nul
    echo ✅ .claude 폴더 삭제 완료
)
echo ✅ .DS_Store 파일들 삭제 완료

echo.
echo [7/7] 폴더 크기 확인...
echo.
echo 📊 정리 후 폴더 크기:
echo.

REM 폴더 크기는 PowerShell로 확인
powershell -command "Get-ChildItem -Path . -Recurse | Measure-Object -Property Length -Sum | ForEach-Object {'{0:N2} MB' -f ($_.Sum / 1MB)}"

echo.
echo ================================================
echo 🎉 프로젝트 폴더 정리 완료!
echo ================================================
echo.
echo ✅ 삭제된 항목들:
echo    - node_modules (개발 의존성)
echo    - build (빌드 결과물) 
echo    - 중복 폴더들
echo    - 시스템 파일들
echo.
echo 💡 이제 프로젝트 크기가 크게 줄어들었습니다.
echo    Docker 빌드 시 필요한 파일들은 자동으로 생성됩니다.
echo.
echo 📦 배포용 압축 파일을 만들려면:
echo    1. 현재 폴더를 ZIP으로 압축하세요
echo    2. Windows-설치가이드.md와 함께 배포하세요
echo.
pause