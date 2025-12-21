# PDF 生成服务器

服务器端 PDF 生成服务，避免客户端下载大型字体文件。

## 启动服务器

```bash
npm run server
```

服务器将在 `http://localhost:3002` 启动（默认端口，可通过环境变量 `PORT` 修改）。

## API 端点

### POST /api/generate-pdf

生成 PDF 报告。

**请求体：**
```json
{
  "scores": {
    "inattention": { "average": 1.2, "label": "...", "desc": "..." },
    "hyperactivity_impulsivity": { ... },
    "oppositional": { ... }
  },
  "aiAnalysis": "AI 生成的完整分析文本...",
  "lang": "zh",
  "translations": { ... },
  "domainLabels": {
    "inattention": "注意力相关特征",
    "hyperactivity_impulsivity": "多动 / 冲动相关特征",
    "oppositional": "对立违抗相关特征"
  }
}
```

**响应：**
- Content-Type: `application/pdf`
- 返回 PDF 文件的二进制数据

## 环境变量

- `PORT`: 服务器端口（默认：3002，避免与 fluiddam 的 3001 端口冲突）

## 部署

在生产环境中，需要：

1. 启动服务器（可以使用 PM2 等进程管理器）
2. 配置 Nginx 反向代理，将 `/api/generate-pdf` 请求转发到服务器
3. 或者直接暴露服务器端口（不推荐，建议使用反向代理）

### Nginx 配置示例

```nginx
location /api/generate-pdf {
    proxy_pass http://localhost:3002;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

