# 部署指南

## 快速部署到 Nginx

### 1. 构建生产版本

在项目根目录执行：

```bash
npm run build
```

构建完成后，会在 `dist/` 目录生成所有静态文件。

### 2. 复制文件到服务器

将 `dist/` 目录下的所有文件复制到 Nginx 的网站根目录：

```bash
# 方式1: 使用 scp（从本地到服务器）
scp -r dist/* user@your-server:/var/www/adhd-snap/

# 方式2: 在服务器上直接构建
# 在服务器上克隆项目，运行 npm install && npm run build
# 然后复制 dist/ 到网站目录
cp -r dist/* /var/www/adhd-snap/
```

### 3. 配置 Nginx

创建或编辑 Nginx 配置文件（通常在 `/etc/nginx/sites-available/`）：

```bash
sudo nano /etc/nginx/sites-available/adhd-snap
```

将 `nginx.conf.example` 中的配置内容复制进去，并修改：
- `server_name`: 你的域名或 IP
- `root`: 你的网站根目录路径

### 4. 启用站点并重启 Nginx

```bash
# 创建软链接（如果还没有）
sudo ln -s /etc/nginx/sites-available/adhd-snap /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 5. 验证部署

访问你的域名或 IP，应该能看到应用正常运行。

## 使用部署脚本（可选）

你也可以使用提供的部署脚本：

```bash
chmod +x deploy.sh
./deploy.sh
```

## 常见问题

### 路由404错误

确保 Nginx 配置中有：
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 静态资源404

检查文件路径是否正确，确保所有文件都已复制到网站根目录。

### 权限问题

确保 Nginx 用户有读取权限：
```bash
sudo chown -R www-data:www-data /var/www/adhd-snap
sudo chmod -R 755 /var/www/adhd-snap
```

