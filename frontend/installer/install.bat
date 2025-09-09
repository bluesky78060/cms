@echo off
chcp 65001 >nul
title 건설업 관리 시스템 설치
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                        🏗️ 건설업 관리 시스템 설치                          ║
echo ║                          Windows Installer v1.0                           ║
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
echo 📋 설치 과정:
echo [1/6] 시스템 요구사항 확인
echo [2/6] Node.js 설치 확인/설치
echo [3/6] 프로젝트 파일 설정
echo [4/6] 의존성 패키지 설치
echo [5/6] 시스템 서비스 등록
echo [6/6] 바탕화면 바로가기 생성
echo.

pause

:: 1단계: 시스템 요구사항 확인
echo.
echo [1/6] 🔍 시스템 요구사항 확인 중...

:: Windows 버전 확인
for /f "tokens=4-5 delims=. " %%i in ('ver') do set VERSION=%%i.%%j
echo     Windows 버전: %VERSION%

:: 메모리 확인 (GB 단위)
for /f "skip=1" %%p in ('wmic computersystem get TotalPhysicalMemory') do (
    set /a MEMORY=%%p/1024/1024/1024
    goto :memory_done
)
:memory_done
echo     시스템 메모리: %MEMORY%GB

if %MEMORY% LSS 4 (
    echo     ⚠️ 경고: 권장 메모리는 4GB 이상입니다.
    echo     현재 시스템에서도 동작하지만 성능이 제한될 수 있습니다.
)

:: 여유 공간 확인
for /f "tokens=3" %%a in ('dir /-c %SystemDrive%\ ^| find "bytes free"') do set FREE_SPACE=%%a
set /a FREE_GB=%FREE_SPACE:~0,-9%/1024
echo     C: 드라이브 여유공간: %FREE_GB%GB

if %FREE_GB% LSS 2 (
    echo     ❌ 오류: 최소 2GB 이상의 여유공간이 필요합니다.
    pause
    exit /b 1
)

echo     ✅ 시스템 요구사항 확인 완료
timeout /t 2 /nobreak >nul

:: 2단계: Node.js 확인/설치
echo.
echo [2/6] 🔧 Node.js 설치 확인 중...

node --version >nul 2>&1
if %errorLevel% == 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo     ✅ Node.js가 이미 설치되어 있습니다: %NODE_VERSION%
) else (
    echo     ❌ Node.js가 설치되어 있지 않습니다.
    echo.
    echo     Node.js를 수동으로 설치해야 합니다:
    echo     1. https://nodejs.org/ 방문
    echo     2. LTS 버전 다운로드 (Windows Installer .msi)
    echo     3. 설치 후 이 스크립트를 다시 실행해주세요.
    echo.
    echo     자동 다운로드를 시도하시겠습니까? (Y/N)
    set /p DOWNLOAD_NODE=
    
    if /i "%DOWNLOAD_NODE%"=="Y" (
        echo     📥 Node.js 다운로드 중...
        powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.17.1/node-v18.17.1-x64.msi' -OutFile 'node-installer.msi'}"
        
        if exist "node-installer.msi" (
            echo     🚀 Node.js 설치 시작...
            start /wait msiexec /i node-installer.msi /quiet
            del node-installer.msi
            
            echo     설치 완료. 시스템 재부팅 후 이 스크립트를 다시 실행해주세요.
            pause
            exit /b 0
        ) else (
            echo     ❌ 다운로드 실패. 수동 설치를 진행해주세요.
            pause
            exit /b 1
        )
    ) else (
        pause
        exit /b 1
    )
)

:: npm 버전 확인
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo     ✅ npm 버전: %NPM_VERSION%

:: 3단계: 프로젝트 파일 설정
echo.
echo [3/6] 📁 프로젝트 파일 설정 중...

set INSTALL_DIR=C:\ConstructionManagement
echo     설치 위치: %INSTALL_DIR%

if exist "%INSTALL_DIR%" (
    echo     ⚠️ 기존 설치가 감지되었습니다.
    echo     기존 설치를 제거하고 새로 설치하시겠습니까? (Y/N)
    set /p REMOVE_OLD=
    
    if /i "%REMOVE_OLD%"=="Y" (
        echo     🗑️ 기존 설치 제거 중...
        rmdir /s /q "%INSTALL_DIR%" 2>nul
    ) else (
        echo     설치를 중단합니다.
        pause
        exit /b 0
    )
)

:: 설치 디렉토리 생성
mkdir "%INSTALL_DIR%" 2>nul
cd /d "%INSTALL_DIR%"

:: 현재 스크립트 위치에서 프로젝트 파일 복사
set SCRIPT_DIR=%~dp0
echo     스크립트 위치: %SCRIPT_DIR%

if exist "%SCRIPT_DIR%\..\package.json" (
    echo     📋 프로젝트 파일 복사 중...
    
    xcopy "%SCRIPT_DIR%\..\*" "%INSTALL_DIR%\" /E /I /Q /Y >nul 2>&1
    
    if exist "%INSTALL_DIR%\package.json" (
        echo     ✅ 프로젝트 파일 복사 완료
    ) else (
        echo     ❌ 프로젝트 파일 복사 실패
        pause
        exit /b 1
    )
) else (
    echo     ❌ 프로젝트 파일을 찾을 수 없습니다.
    echo     설치 스크립트가 올바른 위치에 있는지 확인해주세요.
    pause
    exit /b 1
)

:: 4단계: 의존성 패키지 설치
echo.
echo [4/6] 📦 의존성 패키지 설치 중...
echo     ⏳ 이 과정은 3-5분 정도 소요됩니다. 잠시만 기다려주세요...

call npm install
if %errorLevel% == 0 (
    echo     ✅ 의존성 패키지 설치 완료
) else (
    echo     ❌ 패키지 설치 실패
    echo     인터넷 연결을 확인하고 다시 시도해주세요.
    pause
    exit /b 1
)

:: 프로덕션 빌드
echo     🏗️ 프로덕션 빌드 생성 중...
call npm run build
if %errorLevel% == 0 (
    echo     ✅ 프로덕션 빌드 완료
) else (
    echo     ⚠️ 빌드 실패. 개발 서버로만 실행됩니다.
)

:: 5단계: 시스템 서비스 등록
echo.
echo [5/6] ⚙️ 시스템 서비스 설정 중...

:: Windows 서비스 스크립트 생성
echo const Service = require('node-windows').Service; > service-install.js
echo. >> service-install.js
echo const svc = new Service({ >> service-install.js
echo   name: '건설업관리시스템', >> service-install.js
echo   description: 'Construction Management System Web Server', >> service-install.js
echo   script: '%INSTALL_DIR%\\server.js' >> service-install.js
echo }); >> service-install.js
echo. >> service-install.js
echo svc.on('install', function(){ >> service-install.js
echo   console.log('서비스가 설치되었습니다.'); >> service-install.js
echo   svc.start(); >> service-install.js
echo }); >> service-install.js
echo. >> service-install.js
echo svc.install(); >> service-install.js

:: 서버 시작 스크립트 생성
echo const express = require('express'); > server.js
echo const path = require('path'); >> server.js
echo. >> server.js
echo const app = express(); >> server.js
echo const PORT = process.env.PORT ^|^| 3000; >> server.js
echo. >> server.js
echo app.use(express.static(path.join(__dirname, 'build'))); >> server.js
echo. >> server.js
echo app.get('*', (req, res) =^> { >> server.js
echo   res.sendFile(path.join(__dirname, 'build', 'index.html')); >> server.js
echo }); >> server.js
echo. >> server.js
echo app.listen(PORT, () =^> { >> server.js
echo   console.log(`건설업 관리 시스템이 포트 ${PORT}에서 실행 중입니다.`); >> server.js
echo }); >> server.js

:: Express 설치 (서버용)
call npm install express --save
echo     ✅ 웹 서버 설정 완료

:: 6단계: 바탕화면 바로가기 생성
echo.
echo [6/6] 🔗 바탕화면 바로가기 생성 중...

:: 시작 스크립트
echo @echo off > "%INSTALL_DIR%\start-system.bat"
echo title 건설업 관리 시스템 서버 >> "%INSTALL_DIR%\start-system.bat"
echo echo 건설업 관리 시스템을 시작합니다... >> "%INSTALL_DIR%\start-system.bat"
echo cd /d "%INSTALL_DIR%" >> "%INSTALL_DIR%\start-system.bat"
echo start http://localhost:3000 >> "%INSTALL_DIR%\start-system.bat"
echo node server.js >> "%INSTALL_DIR%\start-system.bat"

:: 중지 스크립트
echo @echo off > "%INSTALL_DIR%\stop-system.bat"
echo echo 건설업 관리 시스템을 중지합니다... >> "%INSTALL_DIR%\stop-system.bat"
echo taskkill /f /im node.exe 2^>nul >> "%INSTALL_DIR%\stop-system.bat"
echo echo 시스템이 중지되었습니다. >> "%INSTALL_DIR%\stop-system.bat"
echo pause >> "%INSTALL_DIR%\stop-system.bat"

:: 바탕화면 바로가기 생성 (PowerShell 사용)
set DESKTOP=%USERPROFILE%\Desktop

powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP%\건설업관리시스템.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\start-system.bat'; $Shortcut.IconLocation = '%INSTALL_DIR%\favicon.ico'; $Shortcut.Save()}"

powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP%\시스템중지.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\stop-system.bat'; $Shortcut.Save()}"

:: 배포 가이드 바로가기
if exist "%INSTALL_DIR%\windows-deployment-guide.html" (
    powershell -Command "& {$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%DESKTOP%\설치가이드.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\windows-deployment-guide.html'; $Shortcut.Save()}"
)

echo     ✅ 바탕화면 바로가기 생성 완료

:: 설치 완료 메시지
echo.
echo ╔══════════════════════════════════════════════════════════════════════════════╗
echo ║                            🎉 설치 완료!                                   ║
echo ╚══════════════════════════════════════════════════════════════════════════════╝
echo.
echo ✅ 건설업 관리 시스템이 성공적으로 설치되었습니다!
echo.
echo 📁 설치 위치: %INSTALL_DIR%
echo 🌐 접속 주소: http://localhost:3000
echo.
echo 🚀 사용 방법:
echo    1. 바탕화면의 '건설업관리시스템' 아이콘을 더블클릭
echo    2. 웹 브라우저가 자동으로 열립니다
echo    3. 시스템 종료: 바탕화면의 '시스템중지' 아이콘 클릭
echo.
echo 📖 도움말: 바탕화면의 '설치가이드' 참조
echo.
echo 지금 시스템을 시작하시겠습니까? (Y/N)
set /p START_NOW=

if /i "%START_NOW%"=="Y" (
    echo.
    echo 🚀 시스템을 시작합니다...
    start "" "%INSTALL_DIR%\start-system.bat"
    timeout /t 3 /nobreak >nul
)

echo.
echo 설치가 완료되었습니다. 창을 닫으셔도 됩니다.
pause