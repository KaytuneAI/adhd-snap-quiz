// src/utils/pdfExport.js
import { jsPDF } from 'jspdf'

/**
 * 导出结果为PDF
 * @param {Object} options - 导出选项
 * @param {Object} options.scores - 分数对象
 * @param {string} options.aiAnalysis - AI分析文本
 * @param {string} options.lang - 语言 ('zh' 或 'en')
 * @param {Function} options.domainLabel - 域名标签函数
 * @param {Object} options.translations - 翻译对象
 */
export async function exportToPDF({ scores, aiAnalysis, lang, domainLabel, translations }) {

  // 创建PDF文档 (A4尺寸: 210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = 210
  const pageHeight = 297
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let yPos = margin

  // 设置中文字体支持（如果需要）
  // doc.setFont('helvetica')

  // 1. Logo区域（顶部）
  // 绘制聚心logo的简化版本（蓝色绿色圆圈和红色脸颊）
  const logoSize = 20
  const logoX = pageWidth / 2
  const logoY = yPos + logoSize / 2

  // 顶部蓝色绿色圆圈（眼睛）
  doc.setFillColor(170, 210, 209) // #aad2d1
  doc.circle(logoX, logoY - 8, 4, 'F')

  // 微笑弧线（用两个小圆点模拟）
  doc.setFillColor(170, 210, 209)
  doc.circle(logoX - 12, logoY + 2, 2, 'F')
  doc.circle(logoX, logoY + 4, 2, 'F')
  doc.circle(logoX + 12, logoY + 2, 2, 'F')

  // 左侧红色脸颊
  doc.setFillColor(221, 82, 98) // #dd5262
  doc.circle(logoX - 12, logoY + 2, 2.5, 'F')

  // 右侧红色脸颊
  doc.circle(logoX + 12, logoY + 2, 2.5, 'F')

  yPos += logoSize + 8

  // Logo文字
  doc.setFontSize(16)
  doc.setTextColor(31, 41, 55) // #1f2937
  doc.setFont('helvetica', 'normal')
  const logoText = '聚心ADHD'
  const logoTextWidth = doc.getTextWidth(logoText)
  doc.text(logoText, pageWidth / 2, yPos, { align: 'center' })
  yPos += 8

  // 2. 标题
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(31, 41, 55)
  const title = translations.result.title || 'SNAP-IV 评估结果'
  doc.text(title, pageWidth / 2, yPos, { align: 'center' })
  yPos += 10

  // 3. 描述
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128) // #6b7280
  const description = translations.result.description || '以下是您的评估结果'
  const descLines = doc.splitTextToSize(description, contentWidth)
  doc.text(descLines, pageWidth / 2, yPos, { align: 'center' })
  yPos += 12

  // 4. 各维度得分
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text(lang === 'zh' ? '各维度得分' : 'Domain Scores', margin, yPos)
  yPos += 8

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  
  Object.entries(scores).forEach(([domain, detail]) => {
    // 检查是否需要新页面
    if (yPos > pageHeight - 30) {
      doc.addPage()
      yPos = margin
    }

    // 域名
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(31, 41, 55)
    doc.text(domainLabel(domain), margin, yPos)
    
    // 分数和标签
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    const scoreText = `${translations.result.averageScore || '平均分'} ${detail.average} - ${detail.label}`
    doc.text(scoreText, margin + 60, yPos)
    yPos += 6
  })

  yPos += 8

  // 5. AI分析
  if (aiAnalysis && aiAnalysis.trim()) {
    // 检查是否需要新页面
    if (yPos > pageHeight - 40) {
      doc.addPage()
      yPos = margin
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(31, 41, 55)
    const aiTitle = lang === 'zh' ? 'AI 专业分析' : 'AI Professional Analysis'
    doc.text(aiTitle, margin, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(75, 85, 99) // #4b5563
    
    // 分割AI分析文本为多行
    const analysisLines = doc.splitTextToSize(aiAnalysis, contentWidth)
    
    analysisLines.forEach((line) => {
      // 检查是否需要新页面
      if (yPos > pageHeight - 15) {
        doc.addPage()
        yPos = margin
      }
      doc.text(line, margin, yPos)
      yPos += 5
    })
  }

  yPos += 10

  // 6. Disclaimer（底部）
  // 检查是否需要新页面
  if (yPos > pageHeight - 20) {
    doc.addPage()
    yPos = margin
  }

  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(156, 163, 175) // #9ca3af
  const disclaimer = translations.result.disclaimer || '本结果仅供参考，不构成医学诊断'
  const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth)
  disclaimerLines.forEach((line) => {
    if (yPos > pageHeight - 10) {
      doc.addPage()
      yPos = margin
    }
    doc.text(line, pageWidth / 2, yPos, { align: 'center' })
    yPos += 4
  })

  // 7. 生成文件名并保存
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD
  const timeStr = now.toTimeString().slice(0, 5).replace(':', '') // HHMM
  const filename = `ADHD-SNAP4-${dateStr}-${timeStr}.pdf`

  doc.save(filename)
}

