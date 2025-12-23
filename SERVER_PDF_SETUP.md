# 服务器端 PDF 生成设置指南

## 概述

现在 PDF 生成已移至服务器端，这样可以：
- ✅ **不需要在客户端下载大型字体文件**（每个约 14MB）
- ✅ **更快的初始页面加载速度**
- ✅ **更好的性能**（服务器端处理）

## 安装依赖

```bash
npm install
```

这会安装：
- `express` - Web 服务器
- `cors` - CORS 支持
- `concurrently` - 同时运行前端和服务器（开发用）

## 开发环境

### 方式 1：分别启动（推荐）

**终端 1 - 前端：**
```bash
npm run dev
```

**终端 2 - 服务器：**
```bash
npm run server
```

### 方式 2：同时启动

```bash
npm run dev:full
```

这会同时启动前端（端口 5173）和 PDF 服务器（端口 3002）。

## 生产环境部署

### 1. 启动 PDF 服务器

在服务器上启动 PDF 生成服务：

```bash
# 使用 PM2（推荐）
pm2 start server/index.js --name pdf-generator

# 或直接运行
npm run server
```

### 2. 配置 Nginx 反向代理

在 Nginx 配置中添加：

```nginx
# PDF 生成 API
location /api/generate-pdf {
    proxy_pass http://localhost:3002;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # 增加超时时间（PDF 生成可能需要几秒）
    proxy_read_timeout 60s;
    proxy_connect_timeout 60s;
}
```

### 3. 环境变量（可选）

如果需要更改服务器端口（默认 3002，避免与 fluiddam 的 3001 端口冲突），设置环境变量：

```bash
export PORT=3002
```

或在 `.env` 文件中：
```
PORT=3002
```

**注意：** 如果服务器上已有其他服务占用 3002 端口，可以改为其他端口（如 3003、3004 等）。

## 前端配置

### 开发环境

前端会自动通过 Vite 代理访问 `http://localhost:3001/api/generate-pdf`。

### 生产环境

如果 PDF 服务器部署在不同的 URL，需要设置环境变量：

```env
VITE_PDF_API_URL=https://your-domain.com/api/generate-pdf
```

然后在构建时：
```bash
npm run build
```

## 测试

1. 启动服务器：`npm run server`
2. 访问前端：`http://localhost:5173`
3. 完成测评并查看结果
4. 点击"保存为 PDF"按钮
5. 应该会从服务器生成 PDF 并下载

## 故障排除

### 问题：PDF 生成失败

**检查：**
1. 服务器是否正在运行（`http://localhost:3002/api/health`）
2. 字体文件是否存在（`src/fonts/static/NotoSansSC-Regular.ttf` 和 `NotoSansSC-Bold.ttf`）
3. Logo 文件是否存在（`src/assets/logos/jx_adhd_logo.jpg`）

### 问题：CORS 错误

确保服务器启用了 CORS（已在代码中配置）。

### 问题：超时

如果 PDF 生成时间较长，增加 Nginx 的 `proxy_read_timeout`。

## 文件结构

```
server/
  ├── index.js          # Express 服务器
  ├── pdfGenerator.js   # PDF 生成逻辑
  └── README.md         # 服务器文档

src/
  └── utils/
      ├── pdfExport.js  # 客户端 PDF 生成（已弃用，但保留作为备用）
      └── pdfApi.js     # 调用服务器 API 的客户端函数
```

## 优势

### 之前（客户端生成）
- ❌ 需要下载 28MB 字体文件
- ❌ 初始页面加载慢
- ❌ 移动端体验差

### 现在（服务器端生成）
- ✅ 不需要下载字体文件
- ✅ 初始页面加载快（约 200KB）
- ✅ 更好的移动端体验
- ✅ 服务器端可以缓存字体，性能更好

