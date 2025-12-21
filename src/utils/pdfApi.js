// src/utils/pdfApi.js
// 调用服务器端 PDF 生成 API

/**
 * 通过服务器 API 生成 PDF
 * @param {Object} options - 导出选项
 * @param {Object} options.scores - 分数对象
 * @param {string} options.aiAnalysis - AI分析文本
 * @param {string} options.lang - 语言 ('zh' 或 'en')
 * @param {Function} options.domainLabel - 域名标签函数（用于生成 domainLabels 对象）
 * @param {Object} options.translations - 翻译对象
 * @returns {Promise<void>}
 */
export async function generatePDFViaAPI({ scores, aiAnalysis, lang, domainLabel, translations }) {
  // 构建 domainLabels 对象（服务器端需要）
  const domainLabels = {}
  Object.keys(scores).forEach(domain => {
    domainLabels[domain] = domainLabel(domain)
  })

  // 准备请求数据
  const requestData = {
    scores,
    aiAnalysis,
    lang,
    translations,
    domainLabels
  }

  // 确定 API URL（开发环境使用代理，生产环境使用完整 URL）
  const API_URL = import.meta.env.DEV
    ? '/api/generate-pdf'  // 开发环境：通过 Vite 代理
    : (import.meta.env.VITE_PDF_API_URL || 'http://localhost:3002/api/generate-pdf')  // 生产环境

  try {
    // 显示加载提示
    console.log('📄 正在生成 PDF...')

    // 发送请求
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    // 获取 PDF blob
    const pdfBlob = await response.blob()

    // 生成文件名
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '')
    const filename = `SNAP-IV-Report-${dateStr}-${timeStr}.pdf`

    // 下载 PDF
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // 清理 URL
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 100)

    console.log('✅ PDF 生成成功')
  } catch (error) {
    console.error('❌ PDF 生成失败:', error)
    throw error
  }
}

