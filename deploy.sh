#!/bin/bash

# 构建生产版本
echo "正在构建生产版本..."
npm run build

# 检查构建是否成功
if [ $? -eq 0 ]; then
    echo "✅ 构建成功！"
    echo "📦 构建文件位于 dist/ 目录"
    echo ""
    echo "下一步："
    echo "1. 将 dist/ 目录下的所有文件复制到 Nginx 的网站根目录"
    echo "2. 确保 Nginx 配置了正确的路由规则（见 nginx.conf 示例）"
    echo "3. 重启 Nginx: sudo systemctl restart nginx"
else
    echo "❌ 构建失败，请检查错误信息"
    exit 1
fi

