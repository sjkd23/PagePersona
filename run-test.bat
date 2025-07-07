@echo off
echo ========================================
echo  Running Tests for Client & Server
echo ========================================

REM Get the directory where this batch file is located
set SCRIPT_DIR=%~dp0

REM Set paths relative to script directory
set CLIENT_DIR=%SCRIPT_DIR%client
set SERVER_DIR=%SCRIPT_DIR%server

REM Check if directories exist
if not exist "%CLIENT_DIR%" (
    echo ERROR: Client directory not found at %CLIENT_DIR%
    pause
    exit /b 1
)

if not exist "%SERVER_DIR%" (
    echo ERROR: Server directory not found at %SERVER_DIR%
    pause
    exit /b 1
)

REM Check if package.json files exist
if not exist "%CLIENT_DIR%\package.json" (
    echo ERROR: Client package.json not found
    pause
    exit /b 1
)

if not exist "%SERVER_DIR%\package.json" (
    echo ERROR: Server package.json not found
    pause
    exit /b 1
)

echo.
echo Starting test suites...
echo.

REM Run client tests in new terminal with proper error handling
echo Starting Client Tests...
start "Client Tests - PagePersonAI" cmd /k "cd /d "%CLIENT_DIR%" && echo Running Client Tests... && npm run test || (echo Client tests failed & pause)"

REM Small delay to avoid terminal conflicts
timeout /t 2 /nobreak >nul

REM Run server tests in new terminal with proper error handling
echo Starting Server Tests...
start "Server Tests - PagePersonAI" cmd /k "cd /d "%SERVER_DIR%" && echo Running Server Tests... && npm run test || (echo Server tests failed & pause)"

echo.
echo ========================================
echo  Test suites launched in separate terminals!
echo  - Client Tests (React/Frontend)
echo  - Server Tests (Node.js/Backend)
echo ========================================
echo.
echo Press any key to exit...
pause >nul
