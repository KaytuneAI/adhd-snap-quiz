#!/bin/bash

# Ubuntu 服务器快速部署脚本
# 使用方法: sudo bash deploy-ubuntu.sh

set -e  # 遇到错误立即退出

echo "🚀 开始部署 SNAP-IV 应用到 Ubuntu 服务器..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否以 root 或 sudo 运行
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ 请使用 sudo 运行此脚本${NC}"
    exit 1
fi

# 配置变量（根据实际情况修改）
PROJECT_DIR="/usr/local/adhd-snap-quiz"
DEPLOY_DIR="/var/www/adhdsupport.cn/adhd"
DOMAIN="www.adhdsupport.cn"  # 域名
NGINX_SITE="www.adhdsupport.cn"  # Nginx 站点名称

echo "📋 配置信息："
echo "  项目目录: $PROJECT_DIR"
echo "  部署目录: $DEPLOY_DIR"
echo "  域名: $DOMAIN"
echo ""

# 第一步：检查 Node.js
echo "🔍 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js 未安装，正在安装...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo -e "${GREEN}✅ Node.js 已安装: $(node --version)${NC}"
fi

# 第二步：检查 npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm 未找到${NC}"
    exit 1
else
    echo -e "${GREEN}✅ npm 已安装: $(npm --version)${NC}"
fi

# 第三步：检查 Nginx
echo ""
echo "🔍 检查 Nginx..."
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}⚠️  Nginx 未安装，正在安装...${NC}"
    apt-get update
    apt-get install -y nginx
    systemctl start nginx
    systemctl enable nginx
else
    echo -e "${GREEN}✅ Nginx 已安装${NC}"
fi

# 第四步：检查项目目录
echo ""
echo "🔍 检查项目目录..."
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ 项目目录不存在: $PROJECT_DIR${NC}"
    echo "   请先克隆项目: sudo git clone https://github.com/KaytuneAI/adhd-snap-quiz.git $PROJECT_DIR"
    exit 1
else
    echo -e "${GREEN}✅ 项目目录存在${NC}"
fi

# 第五步：安装依赖
echo ""
echo "📦 安装项目依赖..."
cd "$PROJECT_DIR"
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
else
    echo -e "${YELLOW}⚠️  node_modules 已存在，跳过安装${NC}"
    echo "   如需重新安装，请删除 node_modules 目录后重新运行此脚本"
fi

# 第六步：检查 .env 文件
echo ""
echo "🔍 检查环境变量配置..."
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo -e "${YELLOW}⚠️  .env 文件不存在${NC}"
    echo "   创建示例 .env 文件..."
    cat > "$PROJECT_DIR/.env" << EOF
# AI 模型选择：'qwen' 或 'deepseek'（默认：qwen）
VITE_AI_PROVIDER=qwen

# Qwen API 密钥
VITE_QWEN_API_KEY=your_qwen_api_key_here

# DeepSeek API 密钥（如果使用 DeepSeek）
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here

# PDF 服务器端口（可选，默认：3002）
PORT=3002
EOF
    echo -e "${YELLOW}⚠️  请编辑 $PROJECT_DIR/.env 文件，填入正确的 API 密钥${NC}"
    echo "   然后重新运行此脚本"
    exit 1
else
    echo -e "${GREEN}✅ .env 文件存在${NC}"
fi

# 第七步：构建前端
echo ""
echo "🏗️  构建前端应用..."
cd "$PROJECT_DIR"
npm run build
echo -e "${GREEN}✅ 构建完成${NC}"

# 第八步：创建部署目录
echo ""
echo "📁 准备部署目录..."
mkdir -p "$DEPLOY_DIR"
echo -e "${GREEN}✅ 部署目录已创建${NC}"

# 第九步：复制文件
echo ""
echo "📋 复制文件到部署目录..."
cp -r "$PROJECT_DIR/dist/"* "$DEPLOY_DIR/"
chown -R www-data:www-data "$DEPLOY_DIR"
chmod -R 755 "$DEPLOY_DIR"
echo -e "${GREEN}✅ 文件复制完成${NC}"

# 第十步：配置 Nginx
echo ""
echo "⚙️  配置 Nginx..."

NGINX_CONFIG="/etc/nginx/sites-available/$NGINX_SITE"

# 检查是否已存在配置
if [ -f "$NGINX_CONFIG" ]; then
    echo -e "${YELLOW}⚠️  Nginx 配置文件已存在: $NGINX_CONFIG${NC}"
    echo "   请手动检查并更新配置，确保包含以下内容："
    echo "   - /api/generate-pdf 代理到 http://localhost:3002"
    echo "   - /adhd/ location 指向 $DEPLOY_DIR"
    echo ""
    read -p "   是否继续？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    # 创建 Nginx 配置
    cat > "$NGINX_CONFIG" << 'EOF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;
    
    root /var/www/adhdsupport.cn;
    index index.html;
    
    # 启用 gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
    
    # PDF 生成 API
    location /api/generate-pdf {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        client_max_body_size 10M;
    }
    
    # AI API 代理（Qwen）
    location /api/qwen {
        proxy_pass https://dashscope.aliyuncs.com;
        proxy_set_header Host dashscope.aliyuncs.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass_request_headers on;
    }
    
    # AI API 代理（DeepSeek）
    location /api/deepseek {
        proxy_pass https://api.deepseek.com;
        proxy_set_header Host api.deepseek.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass_request_headers on;
    }
    
    # /adhd/ 路径配置
    location /adhd/ {
        alias /var/www/adhdsupport.cn/adhd/;
        try_files $uri $uri/ /adhd/index.html;
        
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF
    
    # 替换域名占位符
    sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" "$NGINX_CONFIG"
    
    # 启用站点
    if [ ! -L "/etc/nginx/sites-enabled/$NGINX_SITE" ]; then
        ln -s "$NGINX_CONFIG" "/etc/nginx/sites-enabled/$NGINX_SITE"
    fi
    
    echo -e "${GREEN}✅ Nginx 配置已创建${NC}"
fi

# 测试 Nginx 配置
echo ""
echo "🔍 测试 Nginx 配置..."
if nginx -t; then
    echo -e "${GREEN}✅ Nginx 配置测试通过${NC}"
    systemctl reload nginx
    echo -e "${GREEN}✅ Nginx 已重新加载${NC}"
else
    echo -e "${RED}❌ Nginx 配置测试失败，请检查配置文件${NC}"
    exit 1
fi

# 第十一步：安装并配置 PM2
echo ""
echo "🔄 配置 PM2..."

if ! command -v pm2 &> /dev/null; then
    echo "   安装 PM2..."
    npm install -g pm2
    echo -e "${GREEN}✅ PM2 已安装${NC}"
else
    echo -e "${GREEN}✅ PM2 已安装${NC}"
fi

# 检查 PDF 服务器是否已运行
cd "$PROJECT_DIR"
if pm2 list | grep -q "pdf-generator"; then
    echo "   重启 PDF 服务器..."
    pm2 restart pdf-generator
else
    echo "   启动 PDF 服务器..."
    pm2 start server/index.js --name pdf-generator
fi

# 保存 PM2 配置
pm2 save

echo -e "${GREEN}✅ PDF 服务器已启动${NC}"

# 第十二步：验证部署
echo ""
echo "✅ 验证部署..."

# 检查 PDF 服务器
if curl -s http://localhost:3002/api/health | grep -q "ok"; then
    echo -e "${GREEN}✅ PDF 服务器运行正常${NC}"
else
    echo -e "${YELLOW}⚠️  PDF 服务器可能未正常运行，请检查: pm2 logs pdf-generator${NC}"
fi

# 检查 Nginx
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx 运行正常${NC}"
else
    echo -e "${RED}❌ Nginx 未运行${NC}"
fi

echo ""
echo -e "${GREEN}🎉 部署完成！${NC}"
echo ""
echo "📝 后续步骤："
echo "   1. 访问应用: http://$DOMAIN/adhd/"
echo "   2. 查看 PM2 状态: pm2 status"
echo "   3. 查看 PM2 日志: pm2 logs pdf-generator"
echo "   4. 查看 Nginx 日志: tail -f /var/log/nginx/error.log"
echo ""
echo "⚠️  重要提示："
echo "   - 确保 .env 文件中的 API 密钥已正确配置"
echo "   - 如需更新代码，运行: git pull && npm run build && sudo cp -r dist/* $DEPLOY_DIR/"
echo "   - 建议配置 HTTPS: sudo certbot --nginx -d $DOMAIN"
echo ""

