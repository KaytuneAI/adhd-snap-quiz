// server/index.js
// Express 服务器，提供 PDF 生成 API

import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { generatePDF } from './pdfGenerator.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3002

// 中间件
app.use(cors())
app.use(express.json({ limit: '10mb' })) // 支持较大的 JSON 请求

// PDF 生成 API
app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { scores, aiAnalysis, lang, translations } = req.body

    if (!scores || !aiAnalysis) {
      return res.status(400).json({ 
        error: 'Missing required fields: scores and aiAnalysis' 
      })
    }

    // 生成 PDF
    const pdfBuffer = await generatePDF({
      scores,
      aiAnalysis,
      lang: lang || 'zh',
      translations: translations || {}
    })

    // 设置响应头
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '')
    const filename = `SNAP-IV-Report-${dateStr}-${timeStr}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', pdfBuffer.length)

    // 发送 PDF
    res.send(pdfBuffer)
  } catch (error) {
    console.error('PDF generation error:', error)
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      message: error.message 
    })
  }
})

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'PDF Generator' })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 PDF Generator Server running on http://localhost:${PORT}`)
  console.log(`📄 PDF API: POST http://localhost:${PORT}/api/generate-pdf`)
  console.log(`💡 Note: Using port ${PORT} to avoid conflict with fluiddam on port 3001`)
})

