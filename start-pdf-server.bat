@echo off
echo Starting PDF Generator Server on port 3002...
echo.

REM 检查是否已经在运行
netstat -ano | findstr :3002 >nul
if %errorlevel% == 0 (
    echo [WARNING] Port 3002 is already in use!
    echo Please stop the existing server first using stop-pdf-server.bat
    pause
    exit /b 1
)

REM 启动服务器（在新窗口中运行，不阻塞）
start "PDF Generator Server" cmd /k "npm run server"

echo.
echo PDF Server started in a new window.
echo You can close this window now.
echo.
echo To stop the server, run: stop-pdf-server.bat
timeout /t 3 >nul

