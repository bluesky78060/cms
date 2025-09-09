@echo off
chcp 65001 >nul
title 건설업 관리 시스템 제거
color 0C

echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                        🗑️ 건설업 관리 시스템 제거                         ║
echo ║                          Windows Uninstaller v1.0                         ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.

:: 관리자 권한 확인
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ 관리자 권한으로 실행 중...
) else (
    echo ❌ 관리자 권한이 필요합니다.
    echo 이 파일을 마우스 우클릭 후 "관리자 권한으로 실행"을 선택해주세요.
    pause
    exit /b 1
)

echo.
echo ⚠️ 경고: 이 작업은 되돌릴 수 없습니다.
echo.
echo 다음 항목들이 제거됩니다:
echo   • 프로그램 파일 (C:\ConstructionManagement)
echo   • 바탕화면 바로가기
echo   • Windows 서비스 (설치된 경우)
echo   • 시작 프로그램 등록 (설정된 경우)
echo.
echo 사용자 데이터(브라우저 localStorage)는 유지됩니다.
echo.
echo 정말로 제거하시겠습니까? (Y/N)
set /p CONFIRM=

if /i not "%CONFIRM%"=="Y" (
    echo 제거가 취소되었습니다.
    pause
    exit /b 0
)

echo.
echo 🗑️ 건설업 관리 시스템을 제거합니다...
echo.

:: 1단계: 실행 중인 프로세스 종료
echo [1/5] 🔴 실행 중인 프로세스 종료...
taskkill /f /im node.exe 2>nul
if %errorLevel% == 0 (
    echo     ✅ Node.js 프로세스 종료 완료
) else (
    echo     ℹ️ 실행 중인 프로세스가 없습니다
)
timeout /t 2 /nobreak >nul

:: 2단계: Windows 서비스 제거
echo.
echo [2/5] ⚙️ Windows 서비스 제거 중...
sc query "건설업관리시스템" >nul 2>&1
if %errorLevel% == 0 (
    echo     🔧 서비스 중지 중...
    sc stop "건설업관리시스템" >nul 2>&1
    timeout /t 3 /nobreak >nul
    
    echo     🗑️ 서비스 제거 중...
    sc delete "건설업관리시스템" >nul 2>&1
    if %errorLevel% == 0 (
        echo     ✅ Windows 서비스 제거 완료
    ) else (
        echo     ⚠️ 서비스 제거 실패 (수동으로 제거해야 할 수 있음)
    )
) else (
    echo     ℹ️ 등록된 서비스가 없습니다
)

:: 3단계: 바탕화면 바로가기 제거
echo.
echo [3/5] 🔗 바탕화면 바로가기 제거 중...
set DESKTOP=%USERPROFILE%\Desktop

del "%DESKTOP%\건설업관리시스템.lnk" 2>nul
if %errorLevel% == 0 (echo     ✅ 시스템 시작 바로가기 제거)

del "%DESKTOP%\시스템중지.lnk" 2>nul
if %errorLevel% == 0 (echo     ✅ 시스템 중지 바로가기 제거)

del "%DESKTOP%\설치가이드.lnk" 2>nul
if %errorLevel% == 0 (echo     ✅ 설치가이드 바로가기 제거)

:: 4단계: 시작 프로그램에서 제거
echo.
echo [4/5] 🚀 시작 프로그램에서 제거 중...
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
del "%STARTUP_DIR%\건설업관리시스템.lnk" 2>nul
if %errorLevel% == 0 (
    echo     ✅ 시작 프로그램에서 제거 완료
) else (
    echo     ℹ️ 시작 프로그램에 등록되지 않았습니다
)

:: 5단계: 프로그램 파일 제거
echo.
echo [5/5] 📁 프로그램 파일 제거 중...
set INSTALL_DIR=C:\ConstructionManagement

if exist "%INSTALL_DIR%" (
    echo     🗑️ 설치 폴더 제거 중: %INSTALL_DIR%
    
    :: 파일 속성 제거 (읽기 전용 등)
    attrib -r -s -h "%INSTALL_DIR%\*.*" /s /d 2>nul
    
    :: 폴더 완전 삭제
    rmdir /s /q "%INSTALL_DIR%" 2>nul
    
    if exist "%INSTALL_DIR%" (
        echo     ⚠️ 일부 파일 제거 실패 (사용 중인 파일이 있을 수 있음)
        echo     컴퓨터 재부팅 후 수동으로 제거해주세요: %INSTALL_DIR%
    ) else (
        echo     ✅ 프로그램 파일 제거 완료
    )
) else (
    echo     ℹ️ 설치 폴더가 존재하지 않습니다
)

:: 레지스트리 정리 (선택사항)
echo.
echo [추가] 🔧 시스템 정리 중...
:: 임시 파일 정리
del "%TEMP%\construction-*.*" 2>nul
del "%TEMP%\npm-*.*" 2>nul
echo     ✅ 임시 파일 정리 완료

:: 제거 완료 메시지
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                            ✅ 제거 완료!                                   ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.
echo 🗑️ 건설업 관리 시스템이 성공적으로 제거되었습니다.
echo.
echo 📋 제거된 항목들:
echo    ✓ 프로그램 파일
echo    ✓ 바탕화면 바로가기
echo    ✓ Windows 서비스
echo    ✓ 시작 프로그램 등록
echo    ✓ 임시 파일
echo.
echo 💾 유지된 항목들:
echo    • 사용자 데이터 (브라우저 localStorage)
echo    • Node.js (다른 프로그램에서 사용할 수 있음)
echo    • 사용자가 생성한 Excel 파일들
echo.
echo ℹ️ 참고사항:
echo   • 브라우저의 건설업 관리 시스템 데이터는 수동으로 삭제해야 합니다
echo   • Node.js가 더 이상 필요없다면 제어판에서 제거할 수 있습니다
echo.
echo 추가로 Node.js도 제거하시겠습니까? (Y/N)
set /p REMOVE_NODE=

if /i "%REMOVE_NODE%"=="Y" (
    echo.
    echo 🔧 Node.js 제거 중...
    
    :: Node.js 제거 시도
    wmic product where "name like 'Node.js'" call uninstall /nointeractive >nul 2>&1
    if %errorLevel% == 0 (
        echo     ✅ Node.js 제거 완료
        echo     ⚠️ 시스템 재부팅을 권장합니다
    ) else (
        echo     ⚠️ Node.js 자동 제거 실패
        echo     제어판 → 프로그램 추가/제거에서 수동으로 제거해주세요
    )
)

echo.
echo 제거가 완료되었습니다. 
echo 이 프로그램을 다시 설치하려면 install.bat를 실행해주세요.
echo.
pause