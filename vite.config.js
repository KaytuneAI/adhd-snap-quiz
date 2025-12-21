import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 根据环境变量决定 base 路径
  // 开发环境：不需要 base 路径
  // 生产环境：使用 /adhd/ 作为 base 路径（Nginx 部署）
  const isProduction = mode === 'production'
  const base = isProduction ? '/adhd/' : '/'

  return {
    base: base,

    plugins: [react()],

    server: {
      host: '0.0.0.0', // 监听所有网络接口，允许局域网访问
      port: 5173,
      strictPort: false, // 如果端口被占用，自动尝试下一个可用端口
      open: false, // 不自动打开浏览器
      cors: true, // 启用 CORS
      proxy: {
        '/api/qwen': {
          target: 'https://dashscope.aliyuncs.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/qwen/, '/compatible-mode/v1/chat/completions'),
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              // 保持原始请求头
              if (req.headers.authorization) {
                proxyReq.setHeader('Authorization', req.headers.authorization)
              }
            })
          }
        },
        '/api/deepseek': {
          target: 'https://api.deepseek.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/deepseek/, '/v1/chat/completions'),
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              // 保持原始请求头
              if (req.headers.authorization) {
                proxyReq.setHeader('Authorization', req.headers.authorization)
              }
            })
          }
        }
      }
    },

    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'router-vendor': ['react-router-dom'],
          },
        },
      },
    },
  }
})
