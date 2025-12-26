@echo off
echo Stopping PDF Generator Server on port 3002...
echo.

REM 查找占用 3002 端口的进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002 ^| findstr LISTENING') do (
    set PID=%%a
    echo Found process with PID: %%a
    taskkill /PID %%a /F >nul 2>&1
    if %errorlevel% == 0 (
        echo Successfully stopped process %%a
    ) else (
        echo Failed to stop process %%a (may require admin rights)
    )
)

REM 检查是否还有进程在运行
netstat -ano | findstr :3002 >nul
if %errorlevel% == 0 (
    echo.
    echo [WARNING] Port 3002 is still in use!
    echo You may need to run this script as Administrator.
) else (
    echo.
    echo PDF Server stopped successfully.
)

echo.
pause



