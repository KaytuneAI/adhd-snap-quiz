# Ubuntu 快速部署指南（精简版）

## 🚀 一键部署（推荐）

```bash
# 1. 克隆项目
sudo git clone https://github.com/KaytuneAI/adhd-snap-quiz.git /var/www/adhd-snap-quiz
cd /var/www/adhd-snap-quiz

# 2. 运行部署脚本
sudo bash deploy-ubuntu.sh
```

## 📋 手动部署步骤

### 1. 安装依赖

```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx

# 项目依赖
cd /var/www/adhd-snap-quiz
npm install
```

### 2. 配置环境变量

```bash
nano .env
```

添加：
```bash
VITE_AI_PROVIDER=qwen
VITE_QWEN_API_KEY=your_key_here
PORT=3002
```

### 3. 构建并部署

```bash
# 构建
npm run build

# 部署
sudo mkdir -p /var/www/liquora.cn/adhd
sudo cp -r dist/* /var/www/liquora.cn/adhd/
sudo chown -R www-data:www-data /var/www/liquora.cn/adhd
```

### 4. 配置 Nginx

```bash
sudo nano /etc/nginx/sites-available/liquora.cn
```

参考 `nginx.conf.example` 或 `UBUNTU_DEPLOY.md` 中的完整配置。

### 5. 启动服务

```bash
# 安装 PM2
sudo npm install -g pm2

# 启动 PDF 服务器
cd /var/www/adhd-snap-quiz
pm2 start server/index.js --name pdf-generator
pm2 save
pm2 startup  # 按提示执行命令

# 重启 Nginx
sudo nginx -t
sudo nginx -s reload
```

## ✅ 验证

```bash
# 检查 PDF 服务器
curl http://localhost:3002/api/health

# 访问应用
# http://your-domain/adhd/
```

## 🔄 更新代码

```bash
cd /var/www/adhd-snap-quiz
git pull
npm install  # 如果有新依赖
npm run build
sudo cp -r dist/* /var/www/liquora.cn/adhd/
pm2 restart pdf-generator
```

## 📚 详细文档

查看 `UBUNTU_DEPLOY.md` 获取完整部署指南和故障排除。

