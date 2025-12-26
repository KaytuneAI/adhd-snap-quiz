# 服务器部署指南

## 服务器端需要做的配置

### 1. 启动 PDF 生成服务器

在服务器上，进入项目目录，启动 PDF 服务器：

```bash
cd /path/to/adhd-snap-quiz  # 替换为你的实际路径

# 方式 1：直接运行（测试用）
npm run server

# 方式 2：使用 PM2（推荐，生产环境）
pm2 start server/index.js --name pdf-generator
pm2 save  # 保存配置，开机自启
```

服务器将在 **端口 3002** 启动（避免与 fluiddam 的 3001 冲突）。

### 2. 配置 Nginx 反向代理

在你的 Nginx 配置文件中（通常是 `/etc/nginx/sites-available/your-site` 或主配置文件），添加以下配置：

```nginx
# 在现有的 server 块中添加

# PDF 生成 API 反向代理
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
```

**重要：** 这个配置应该放在现有的 `/adhd/` location 块**之前**，或者放在 server 块的合适位置。

### 3. 重新加载 Nginx

```bash
# 测试配置是否正确
sudo nginx -t

# 如果测试通过，重新加载配置
sudo nginx -s reload
```

### 4. 验证服务器运行

```bash
# 检查 PDF 服务器是否运行
curl http://localhost:3002/api/health

# 应该返回：
# {"status":"ok","service":"PDF Generator"}
```

### 5. 验证 Nginx 代理

```bash
# 从外部访问（替换为你的域名）
curl https://liquora.cn/api/generate-pdf

# 如果配置正确，应该能访问到 PDF 服务器
```

## 完整的 Nginx 配置示例

如果你需要完整的配置参考，这里是包含 `/adhd/` 和 PDF API 的完整示例：

```nginx
server {
    listen 80;
    server_name liquora.cn;  # 替换为你的域名
    
    # PDF 生成 API（放在前面，优先匹配）
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
    
    # 前端应用（React Router）
    location /adhd/ {
        alias /path/to/adhd/dist/;  # 替换为你的实际路径
        try_files $uri $uri/ /adhd/index.html;
        
        # 静态资源缓存
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # 其他配置...
}
```

## 使用 PM2 管理服务器（推荐）

### 安装 PM2

```bash
npm install -g pm2
```

### 启动 PDF 服务器

```bash
cd /path/to/adhd-snap-quiz
pm2 start server/index.js --name pdf-generator
```

### 常用 PM2 命令

```bash
# 查看运行状态
pm2 status

# 查看日志
pm2 logs pdf-generator

# 重启服务
pm2 restart pdf-generator

# 停止服务
pm2 stop pdf-generator

# 删除服务
pm2 delete pdf-generator

# 保存当前进程列表（开机自启）
pm2 save

# 设置开机自启
pm2 startup
```

## 故障排除

### 问题 1：PDF 生成失败，返回 502 Bad Gateway

**原因：** Nginx 无法连接到 PDF 服务器

**解决：**
1. 检查 PDF 服务器是否运行：`curl http://localhost:3002/api/health`
2. 检查端口是否正确：`netstat -tlnp | grep 3002`
3. 检查 Nginx 配置中的 `proxy_pass` 地址是否正确

### 问题 2：PDF 生成超时

**原因：** 超时时间设置太短

**解决：** 增加 Nginx 配置中的超时时间：
```nginx
proxy_read_timeout 120s;  # 增加到 120 秒
```

### 问题 3：字体文件找不到

**原因：** 服务器端字体文件路径不正确

**解决：** 检查 `server/pdfGenerator.js` 中的字体路径：
```javascript
const FONT_REGULAR_PATH = join(__dirname, '../src/fonts/static/NotoSansSC-Regular.ttf')
const FONT_BOLD_PATH = join(__dirname, '../src/fonts/static/NotoSansSC-Bold.ttf')
```

确保这些文件存在于服务器上。

### 问题 4：CORS 错误

**原因：** 服务器未启用 CORS

**解决：** 检查 `server/index.js` 中是否包含：
```javascript
app.use(cors())
```

## 测试步骤

1. **启动 PDF 服务器**
   ```bash
   npm run server
   # 或
   pm2 start server/index.js --name pdf-generator
   ```

2. **测试服务器健康检查**
   ```bash
   curl http://localhost:3002/api/health
   ```

3. **配置 Nginx 并重新加载**
   ```bash
   sudo nginx -t
   sudo nginx -s reload
   ```

4. **访问前端应用**
   - 打开 `https://liquora.cn/adhd/`
   - 完成测评
   - 点击"保存为 PDF"按钮
   - 应该能成功下载 PDF

## 总结

服务器端需要做的**最小配置**：

1. ✅ 启动 PDF 服务器（端口 3002）
2. ✅ 配置 Nginx 反向代理 `/api/generate-pdf` → `http://localhost:3002`
3. ✅ 重新加载 Nginx

就这么简单！🎉




