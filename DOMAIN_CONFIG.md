# 域名配置总结 - www.adhdsupport.cn

本文档总结了所有需要配置域名 `www.adhdsupport.cn` 的地方。

## 📁 项目目录

- **项目目录**：`/usr/local/adhd-snap-quiz`
- **部署目录**：`/var/www/adhdsupport.cn/adhd`

## 📋 已更新的配置文件

### 1. 部署脚本
- **`deploy-ubuntu.sh`**
  - `DOMAIN="www.adhdsupport.cn"`
  - `DEPLOY_DIR="/var/www/adhdsupport.cn/adhd"`
  - `NGINX_SITE="www.adhdsupport.cn"`

### 2. Nginx 配置
- **`nginx.conf.example`**
  - `server_name www.adhdsupport.cn;`
  - `root /var/www/adhdsupport.cn;`
  - `alias /var/www/adhdsupport.cn/adhd/;`

### 3. 部署文档
- **`UBUNTU_DEPLOY.md`** - 完整部署指南
- **`UBUNTU_DEPLOY_QUICK.md`** - 快速参考
- **`SERVER_DEPLOY.md`** - 服务器部署指南

### 4. 其他配置
- **`vite.config.server.js`** - 注释已更新

## 🔧 服务器上需要配置的地方

### 1. 创建部署目录

```bash
sudo mkdir -p /var/www/adhdsupport.cn/adhd
```

### 2. Nginx 配置文件

创建或编辑：`/etc/nginx/sites-available/www.adhdsupport.cn`

关键配置：
```nginx
server {
    listen 80;
    server_name www.adhdsupport.cn;
    
    root /var/www/adhdsupport.cn;
    
    # PDF 生成 API
    location /api/generate-pdf {
        proxy_pass http://localhost:3002;
        # ... 其他配置
    }
    
    # /adhd/ 路径配置
    location /adhd/ {
        alias /var/www/adhdsupport.cn/adhd/;
        try_files $uri $uri/ /adhd/index.html;
    }
}
```

### 3. 启用站点

```bash
sudo ln -s /etc/nginx/sites-available/www.adhdsupport.cn /etc/nginx/sites-enabled/
sudo nginx -t
sudo nginx -s reload
```

### 4. SSL 证书（HTTPS）

```bash
sudo certbot --nginx -d www.adhdsupport.cn
```

## 📝 注意事项

1. **目录结构**：网站根目录使用 `adhdsupport.cn`（去掉 www），但 `server_name` 使用 `www.adhdsupport.cn`
2. **DNS 解析**：确保 `www.adhdsupport.cn` 已正确解析到服务器 IP
3. **防火墙**：确保 80 和 443 端口已开放
4. **权限**：确保 `www-data` 用户有读取权限

## ✅ 验证步骤

1. 检查 Nginx 配置：`sudo nginx -t`
2. 检查文件权限：`ls -la /var/www/adhdsupport.cn/adhd/`
3. 访问应用：`http://www.adhdsupport.cn/adhd/`
4. 测试 PDF 生成功能

## 🔄 如果域名需要更改

如果将来需要更改域名，需要更新以下位置：

1. `deploy-ubuntu.sh` - 部署脚本中的域名变量
2. `nginx.conf.example` - Nginx 配置示例
3. 服务器上的 Nginx 配置文件
4. 所有部署文档中的域名引用

