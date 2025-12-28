# Ubuntu 服务器部署完整指南

本指南将帮助你在 Ubuntu 服务器上部署 SNAP-IV 应用。

## 📋 前置要求

- Ubuntu 18.04+ 或 Ubuntu 20.04+（推荐）
- 具有 sudo 权限的用户
- 已安装 Git
- 域名已解析到服务器 IP（可选，但推荐）

## 🔧 第一步：安装 Node.js 和 npm

### 方式 1：使用 NodeSource（推荐，获取最新版本）

```bash
# 安装 Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version  # 应该显示 v20.x.x
npm --version   # 应该显示 10.x.x
```

### 方式 2：使用 Ubuntu 默认仓库

```bash
sudo apt update
sudo apt install -y nodejs npm
```

## 📦 第二步：安装 Nginx

```bash
sudo apt update
sudo apt install -y nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx  # 开机自启

# 验证 Nginx 运行状态
sudo systemctl status nginx
```

## 🚀 第三步：克隆项目

```bash
# 创建项目目录（可选，根据你的习惯）
sudo mkdir -p /usr/local
cd /usr/local

# 克隆项目（替换为你的 GitHub 仓库地址）
sudo git clone https://github.com/KaytuneAI/adhd-snap-quiz.git
cd adhd-snap-quiz

# 设置目录权限（让当前用户可以操作）
sudo chown -R $USER:$USER /usr/local/adhd-snap-quiz
```

## 📥 第四步：安装项目依赖

```bash
cd /usr/local/adhd-snap-quiz

# 安装依赖
npm install

# 如果安装失败，尝试清理缓存
npm cache clean --force
npm install
```

## 🔐 第五步：配置环境变量

创建 `.env` 文件：

```bash
cd /usr/local/adhd-snap-quiz
nano .env
```

在 `.env` 文件中添加以下内容（根据你的选择配置）：

```bash
# AI 模型选择：'qwen' 或 'deepseek'（默认：qwen）
VITE_AI_PROVIDER=qwen

# Qwen API 密钥（如果使用 Qwen）
VITE_QWEN_API_KEY=your_qwen_api_key_here

# DeepSeek API 密钥（如果使用 DeepSeek）
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here

# PDF 服务器端口（可选，默认：3002）
PORT=3002
```

**获取 API 密钥：**
- Qwen: https://dashscope.console.aliyun.com/
- DeepSeek: https://platform.deepseek.com/

保存文件（`Ctrl+O`，然后 `Enter`，最后 `Ctrl+X`）。

## 🏗️ 第六步：构建前端应用

```bash
cd /usr/local/adhd-snap-quiz

# 构建生产版本
npm run build

# 构建完成后，检查 dist 目录
ls -la dist/
```

构建完成后，`dist/` 目录将包含所有静态文件。

## 📁 第七步：部署静态文件到 Nginx

```bash
# 创建部署目录
sudo mkdir -p /var/www/adhdsupport.cn/adhd

# 复制构建文件到部署目录
sudo cp -r /usr/local/adhd-snap-quiz/dist/* /var/www/adhdsupport.cn/adhd/

# 设置权限
sudo chown -R www-data:www-data /var/www/adhdsupport.cn/adhd
sudo chmod -R 755 /var/www/adhdsupport.cn/adhd
```

**注意：** 将 `/var/www/adhdsupport.cn` 替换为你的实际网站根目录（如果需要）。

## ⚙️ 第八步：配置 Nginx

### 8.1 创建或编辑 Nginx 配置文件

```bash
sudo nano /etc/nginx/sites-available/www.adhdsupport.cn
```

**注意：** 将 `www.adhdsupport.cn` 替换为你的域名或站点名称（如果需要）。

### 8.2 添加以下配置

```nginx
server {
    listen 80;
    server_name www.adhdsupport.cn;  # 域名
    
    # 网站根目录
    root /var/www/adhdsupport.cn;
    index index.html;
    
    # 启用 gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
    
    # PDF 生成 API（必须放在 /adhd/ 之前，优先匹配）
    location /api/generate-pdf {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 增加超时时间（PDF 生成可能需要几秒）
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        
        # 支持大文件上传（AI 分析内容可能较大）
        client_max_body_size 10M;
    }
    
    # AI API 代理（Qwen）
    location /api/qwen {
        proxy_pass https://dashscope.aliyuncs.com;
        proxy_set_header Host dashscope.aliyuncs.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 保持原始请求头（包括 Authorization）
        proxy_pass_request_headers on;
    }
    
    # AI API 代理（DeepSeek）
    location /api/deepseek {
        proxy_pass https://api.deepseek.com;
        proxy_set_header Host api.deepseek.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 保持原始请求头（包括 Authorization）
        proxy_pass_request_headers on;
    }
    
    # /adhd/ 路径配置（React Router 应用）
    location /adhd/ {
        alias /var/www/adhdsupport.cn/adhd/;
        try_files $uri $uri/ /adhd/index.html;
        
        # 静态资源缓存
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
```

### 8.3 启用站点

```bash
# 创建软链接（如果还没有）
sudo ln -s /etc/nginx/sites-available/www.adhdsupport.cn /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 如果测试通过，重新加载 Nginx
sudo nginx -s reload
```

**注意：** 如果测试失败，检查配置文件语法和路径是否正确。

## 🔄 第九步：安装并配置 PM2（进程管理器）

PM2 用于管理 PDF 生成服务器，确保它在后台运行并在系统重启后自动启动。

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 进入项目目录
cd /usr/local/adhd-snap-quiz

# 启动 PDF 服务器
pm2 start server/index.js --name pdf-generator

# 保存当前进程列表（开机自启）
pm2 save

# 设置 PM2 开机自启
pm2 startup
# 执行上面命令后，会显示一条命令，复制并执行它（通常是 sudo env PATH=...）
```

### PM2 常用命令

```bash
# 查看运行状态
pm2 status

# 查看日志
pm2 logs pdf-generator

# 查看实时日志
pm2 logs pdf-generator --lines 50

# 重启服务
pm2 restart pdf-generator

# 停止服务
pm2 stop pdf-generator

# 删除服务
pm2 delete pdf-generator
```

## ✅ 第十步：验证部署

### 10.1 检查 PDF 服务器

```bash
# 检查服务器是否运行
curl http://localhost:3002/api/health

# 应该返回：
# {"status":"ok","service":"PDF Generator"}
```

### 10.2 检查 Nginx 配置

```bash
# 测试 Nginx 配置
sudo nginx -t

# 检查 Nginx 状态
sudo systemctl status nginx
```

### 10.3 访问应用

在浏览器中访问：
- `http://your-domain/adhd/` 或
- `http://your-server-ip/adhd/`

### 10.4 测试完整流程

1. 访问应用首页
2. 完成 SNAP-IV 测评
3. 查看结果页面
4. 点击"保存为 PDF"按钮
5. 确认 PDF 可以正常下载

## 🔒 第十一步：配置 HTTPS（可选但推荐）

### 使用 Let's Encrypt（免费 SSL 证书）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d www.adhdsupport.cn

# 按照提示完成配置
# Certbot 会自动修改 Nginx 配置并设置自动续期
```

证书会自动续期，无需手动操作。

## 🔄 更新部署流程

当代码更新后，按以下步骤更新：

```bash
# 1. 进入项目目录
cd /usr/local/adhd-snap-quiz

# 2. 拉取最新代码
git pull

# 3. 安装新依赖（如果有）
npm install

# 4. 重新构建
npm run build

# 5. 复制新文件到部署目录
sudo cp -r dist/* /var/www/adhdsupport.cn/adhd/

# 6. 重启 PDF 服务器（如果有代码更新）
pm2 restart pdf-generator

# 7. 清除浏览器缓存（或强制刷新 Ctrl+F5）
```

## 🐛 故障排除

### 问题 1：502 Bad Gateway

**原因：** Nginx 无法连接到 PDF 服务器

**解决：**
```bash
# 检查 PDF 服务器是否运行
pm2 status
curl http://localhost:3002/api/health

# 如果服务器未运行，启动它
pm2 start server/index.js --name pdf-generator
```

### 问题 2：404 Not Found（路由问题）

**原因：** Nginx 配置中缺少 `try_files` 指令

**解决：** 确保 `/adhd/` location 块中有：
```nginx
try_files $uri $uri/ /adhd/index.html;
```

### 问题 3：静态资源 404

**原因：** 文件路径或权限问题

**解决：**
```bash
# 检查文件是否存在
ls -la /var/www/adhdsupport.cn/adhd/

# 检查权限
sudo chown -R www-data:www-data /var/www/adhdsupport.cn/adhd
sudo chmod -R 755 /var/www/adhdsupport.cn/adhd
```

### 问题 4：PDF 生成超时

**解决：** 增加 Nginx 超时时间：
```nginx
proxy_read_timeout 120s;
proxy_connect_timeout 120s;
proxy_send_timeout 120s;
```

### 问题 5：AI API 调用失败

**原因：** API 密钥未配置或无效

**解决：**
```bash
# 检查 .env 文件
cat /usr/local/adhd-snap-quiz/.env

# 确认 API 密钥正确
# 注意：.env 文件中的密钥不会被打包到构建文件中
# 需要在构建时通过环境变量传入，或者在前端代码中配置
```

**重要提示：** Vite 的环境变量需要在构建时设置。如果 `.env` 文件在构建后修改，需要重新构建。

### 问题 6：字体文件找不到

**原因：** 服务器端字体文件路径不正确

**解决：**
```bash
# 检查字体文件是否存在
ls -la /usr/local/adhd-snap-quiz/src/fonts/static/

# 应该看到 NotoSansSC-Regular.ttf 和 NotoSansSC-Bold.ttf
```

### 问题 7：端口被占用

**原因：** 3002 端口已被其他服务占用

**解决：**
```bash
# 检查端口占用
sudo netstat -tlnp | grep 3002

# 或者修改 .env 文件中的 PORT
# PORT=3003  # 使用其他端口

# 同时更新 Nginx 配置中的 proxy_pass
# proxy_pass http://localhost:3003;
```

## 📝 检查清单

部署完成后，确认以下项目：

- [ ] Node.js 和 npm 已安装
- [ ] Nginx 已安装并运行
- [ ] 项目已克隆到服务器
- [ ] 依赖已安装（`npm install`）
- [ ] `.env` 文件已配置（API 密钥）
- [ ] 前端已构建（`npm run build`）
- [ ] 静态文件已复制到部署目录
- [ ] Nginx 配置已设置并重新加载
- [ ] PDF 服务器已启动（PM2）
- [ ] PM2 已设置开机自启
- [ ] 应用可以正常访问
- [ ] PDF 生成功能正常
- [ ] AI 分析功能正常

## 🎉 完成！

如果所有步骤都完成，你的应用应该已经成功部署在 Ubuntu 服务器上了！

## 📞 需要帮助？

如果遇到问题，请检查：
1. Nginx 错误日志：`sudo tail -f /var/log/nginx/error.log`
2. PM2 日志：`pm2 logs pdf-generator`
3. 系统日志：`sudo journalctl -u nginx -f`

