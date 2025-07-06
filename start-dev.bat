@echo off
echo Starting Development Servers for Client & Server...

REM Set paths (edit if needed)
set CLIENT_DIR=client
set SERVER_DIR=server

REM Start client in new terminal
start "Client" cmd /k "cd /d %~dp0%CLIENT_DIR% && npm run dev"

REM Start server in new terminal
start "Server" cmd /k "cd /d %~dp0%SERVER_DIR% && npm run dev"

echo Both development environments launched successfully!
