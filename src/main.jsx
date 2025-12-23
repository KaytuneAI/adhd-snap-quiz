import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/global.css'

// 根据构建时的 base 路径设置 basename
// 开发环境：'/'
// 生产环境：'/adhd/'（与 vite.config.js 中的 base 保持一致）
const basename = import.meta.env.PROD ? '/adhd' : '/'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      basename={basename}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

