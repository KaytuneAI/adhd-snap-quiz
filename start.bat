@echo off
chcp 65001 >nul
echo.
echo 🤖 请选择要使用的AI模型：
echo.
echo 1. Qwen (阿里云 DashScope) - 默认
echo 2. DeepSeek
echo.
set /p choice="请输入选项 (1 或 2，直接回车使用默认): "

if "%choice%"=="2" (
    set VITE_AI_PROVIDER=deepseek
    echo ✅ 已选择: DeepSeek
) else (
    set VITE_AI_PROVIDER=qwen
    echo ✅ 已选择: Qwen (默认)
)

echo.
echo 📄 检查 PDF 服务器状态...
netstat -ano | findstr :3002 >nul
if %errorlevel% == 0 (
    echo ✅ PDF 服务器已在运行 (端口 3002)
) else (
    echo 🚀 启动 PDF 服务器...
    start "PDF Generator Server" cmd /k "npm run server"
    timeout /t 2 >nul
    echo ✅ PDF 服务器已启动
)

echo.
echo 🚀 启动开发服务器...
echo.

npm run dev


