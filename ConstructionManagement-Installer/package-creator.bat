@echo off
chcp 65001 >nul
title 설치 패키지 생성기
color 0B

echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                       📦 설치 패키지 생성기                                ║
echo ║                    Construction Management Packager                        ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.

:: 현재 스크립트 위치
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..
set PACKAGE_DIR=%SCRIPT_DIR%ConstructionManagement-Installer

echo 📁 프로젝트 위치: %PROJECT_ROOT%
echo 📦 패키지 위치: %PACKAGE_DIR%
echo.

:: 기존 패키지 디렉토리가 있으면 제거
if exist "%PACKAGE_DIR%" (
    echo 🗑️ 기존 패키지 제거 중...
    rmdir /s /q "%PACKAGE_DIR%"
    timeout /t 1 /nobreak >nul
)

:: 패키지 디렉토리 생성
echo 📁 패키지 디렉토리 생성 중...
mkdir "%PACKAGE_DIR%"
if not exist "%PACKAGE_DIR%" (
    echo ❌ 패키지 디렉토리 생성 실패
    pause
    exit /b 1
)

:: 프로젝트 파일들 복사
echo.
echo 📋 프로젝트 파일 복사 중...

:: 주요 파일들 복사
xcopy "%PROJECT_ROOT%\package.json" "%PACKAGE_DIR%\" /Q /Y >nul 2>&1
xcopy "%PROJECT_ROOT%\package-lock.json" "%PACKAGE_DIR%\" /Q /Y >nul 2>&1
xcopy "%PROJECT_ROOT%\craco.config.js" "%PACKAGE_DIR%\" /Q /Y >nul 2>&1

:: src 폴더 복사
if exist "%PROJECT_ROOT%\src" (
    echo     📂 src 폴더 복사 중...
    xcopy "%PROJECT_ROOT%\src" "%PACKAGE_DIR%\src\" /E /I /Q /Y >nul 2>&1
)

:: public 폴더 복사
if exist "%PROJECT_ROOT%\public" (
    echo     📂 public 폴더 복사 중...
    xcopy "%PROJECT_ROOT%\public" "%PACKAGE_DIR%\public\" /E /I /Q /Y >nul 2>&1
)

:: 배포 가이드 복사
if exist "%PROJECT_ROOT%\windows-deployment-guide.html" (
    echo     📖 배포 가이드 복사 중...
    copy "%PROJECT_ROOT%\windows-deployment-guide.html" "%PACKAGE_DIR%\" >nul 2>&1
)

:: 설치 스크립트들 복사
echo     🔧 설치 스크립트 복사 중...
copy "%SCRIPT_DIR%install.bat" "%PACKAGE_DIR%\" >nul 2>&1
copy "%SCRIPT_DIR%uninstall.bat" "%PACKAGE_DIR%\" >nul 2>&1
copy "%SCRIPT_DIR%README.txt" "%PACKAGE_DIR%\" >nul 2>&1

:: node_modules는 제외 (용량 절약)
echo     ℹ️ node_modules는 제외 (설치 시 자동 다운로드)

:: 불필요한 파일들 제외
echo     🗑️ 불필요한 파일 정리 중...
if exist "%PACKAGE_DIR%\.git" rmdir /s /q "%PACKAGE_DIR%\.git" 2>nul
del "%PACKAGE_DIR%\.gitignore" 2>nul
del "%PACKAGE_DIR%\*.log" 2>nul

:: 설치 안내서 생성
echo.
echo 📝 설치 안내서 생성 중...
echo ================================================================================ > "%PACKAGE_DIR%\시작하기.txt"
echo                        🏗️ 건설업 관리 시스템 설치 안내 >> "%PACKAGE_DIR%\시작하기.txt"
echo ================================================================================ >> "%PACKAGE_DIR%\시작하기.txt"
echo. >> "%PACKAGE_DIR%\시작하기.txt"
echo 🚀 빠른 설치: >> "%PACKAGE_DIR%\시작하기.txt"
echo   1. install.bat 파일을 우클릭 >> "%PACKAGE_DIR%\시작하기.txt"
echo   2. "관리자 권한으로 실행" 선택 >> "%PACKAGE_DIR%\시작하기.txt"
echo   3. 화면 안내에 따라 설치 진행 >> "%PACKAGE_DIR%\시작하기.txt"
echo. >> "%PACKAGE_DIR%\시작하기.txt"
echo 📖 상세 가이드: windows-deployment-guide.html 참조 >> "%PACKAGE_DIR%\시작하기.txt"
echo 🔧 문제 해결: README.txt 참조 >> "%PACKAGE_DIR%\시작하기.txt"
echo. >> "%PACKAGE_DIR%\시작하기.txt"
echo ⚠️ 중요: 관리자 권한으로 실행해야 합니다! >> "%PACKAGE_DIR%\시작하기.txt"
echo ================================================================================ >> "%PACKAGE_DIR%\시작하기.txt"

:: 버전 정보 파일 생성
echo 📋 버전 정보 생성 중...
echo 건설업 관리 시스템 v1.0 > "%PACKAGE_DIR%\VERSION.txt"
echo 패키지 생성일: %date% %time% >> "%PACKAGE_DIR%\VERSION.txt"
echo Node.js 요구버전: v16.x ~ v18.x >> "%PACKAGE_DIR%\VERSION.txt"
echo Windows 호환성: Windows 10/11 (64bit) >> "%PACKAGE_DIR%\VERSION.txt"

:: 폴더 구조 확인
echo.
echo 📊 생성된 패키지 구조:
dir "%PACKAGE_DIR%" /B

:: 패키지 크기 계산
echo.
echo 📏 패키지 크기 계산 중...
for /f "tokens=3" %%a in ('dir "%PACKAGE_DIR%" /s /-c ^| find "bytes"') do set PACKAGE_SIZE=%%a
set /a SIZE_MB=%PACKAGE_SIZE:~0,-6%
echo     총 크기: %SIZE_MB% MB

:: ZIP 파일 생성 (PowerShell 사용)
echo.
echo 📦 ZIP 파일 생성 중...
set ZIP_FILE=%SCRIPT_DIR%ConstructionManagement-Installer-v1.0.zip

if exist "%ZIP_FILE%" del "%ZIP_FILE%"

powershell -Command "& {Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('%PACKAGE_DIR%', '%ZIP_FILE%', 'Optimal', $false)}"

if exist "%ZIP_FILE%" (
    echo     ✅ ZIP 파일 생성 완료: ConstructionManagement-Installer-v1.0.zip
    
    :: ZIP 파일 크기
    for %%F in ("%ZIP_FILE%") do set ZIP_SIZE=%%~zF
    set /a ZIP_MB=%ZIP_SIZE:~0,-6%
    if %ZIP_MB% EQU 0 set ZIP_MB=1
    echo     ZIP 크기: %ZIP_MB% MB
) else (
    echo     ❌ ZIP 파일 생성 실패
)

:: 자가 압축 실행 파일 생성 (7-Zip이 있는 경우)
echo.
echo 🗜️ 자가 압축 실행 파일 생성 시도 중...

:: 7-Zip 경로 확인
set SEVENZIP_PATH=
if exist "C:\Program Files\7-Zip\7z.exe" set SEVENZIP_PATH=C:\Program Files\7-Zip\7z.exe
if exist "C:\Program Files (x86)\7-Zip\7z.exe" set SEVENZIP_PATH=C:\Program Files (x86)\7-Zip\7z.exe

if defined SEVENZIP_PATH (
    echo     📦 7-Zip으로 자가 압축 파일 생성 중...
    "%SEVENZIP_PATH%" a -sfx "%SCRIPT_DIR%ConstructionManagement-Installer-Setup.exe" "%PACKAGE_DIR%\*" -mx9 -r
    
    if exist "%SCRIPT_DIR%ConstructionManagement-Installer-Setup.exe" (
        echo     ✅ 자가 압축 실행 파일 생성 완료: ConstructionManagement-Installer-Setup.exe
        
        for %%F in ("%SCRIPT_DIR%ConstructionManagement-Installer-Setup.exe") do set EXE_SIZE=%%~zF
        set /a EXE_MB=%EXE_SIZE:~0,-6%
        if %EXE_MB% EQU 0 set EXE_MB=1
        echo     실행 파일 크기: %EXE_MB% MB
    )
) else (
    echo     ℹ️ 7-Zip이 설치되지 않아 자가 압축 파일을 생성할 수 없습니다
    echo     ZIP 파일을 사용해 주세요
)

:: 완료 메시지
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                            🎉 패키지 생성 완료!                            ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.
echo ✅ 생성된 파일들:
if exist "%PACKAGE_DIR%" echo     📁 폴더: ConstructionManagement-Installer/
if exist "%ZIP_FILE%" echo     📦 ZIP: ConstructionManagement-Installer-v1.0.zip
if exist "%SCRIPT_DIR%ConstructionManagement-Installer-Setup.exe" echo     🗜️ EXE: ConstructionManagement-Installer-Setup.exe
echo.
echo 📤 배포 방법:
echo   1. ZIP 파일을 다른 컴퓨터로 복사
echo   2. 압축 해제 후 install.bat를 관리자 권한으로 실행
echo   또는
echo   1. 자가 압축 실행 파일(.exe)을 다른 컴퓨터로 복사
echo   2. 실행 파일을 더블클릭하여 압축 해제 후 설치
echo.
echo 📋 포함된 내용:
echo   • 전체 React 애플리케이션 소스코드
echo   • 자동 설치 스크립트 (install.bat)
echo   • 제거 스크립트 (uninstall.bat)
echo   • 상세 배포 가이드 (PPT)
echo   • 사용 설명서 및 문제 해결 가이드
echo.
echo 패키지가 준비되었습니다!
echo.

:: 탐색기에서 결과 폴더 열기
echo 결과 폴더를 열어보시겠습니까? (Y/N)
set /p OPEN_FOLDER=

if /i "%OPEN_FOLDER%"=="Y" (
    explorer "%SCRIPT_DIR%"
)

pause