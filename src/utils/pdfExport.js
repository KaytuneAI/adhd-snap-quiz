// src/utils/pdfExport.js
import { jsPDF } from 'jspdf'
import { generateReportContent, parseAIAnalysis } from './reportContent'
import logoImageUrl from '../assets/logos/jx_adhd_logo.jpg'

// 字体文件使用动态导入，只在需要生成PDF时加载（减少初始加载时间）
let fontRegularBase64 = null
let fontBoldBase64 = null
let fontsLoaded = false

/**
 * 导出结果为PDF - 按照7个模块结构生成专业报告
 * @param {Object} options - 导出选项
 * @param {Object} options.scores - 分数对象
 * @param {string} options.aiAnalysis - AI分析文本
 * @param {string} options.lang - 语言 ('zh' 或 'en')
 * @param {Function} options.domainLabel - 域名标签函数
 * @param {Object} options.translations - 翻译对象
 */
export async function exportToPDF({ scores, aiAnalysis, lang, domainLabel, translations }) {
  // 动态加载字体文件（只在需要时加载，减少初始bundle大小）
  if (!fontsLoaded) {
    try {
      const [regularModule, boldModule] = await Promise.all([
        import('../assets/fonts/NotoSansSC-Regular.base64.js'),
        import('../assets/fonts/NotoSansSC-Bold.base64.js')
      ])
      fontRegularBase64 = regularModule.default
      fontBoldBase64 = boldModule.default
      fontsLoaded = true
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to load fonts:', error)
      }
      throw new Error('无法加载字体文件，PDF导出失败')
    }
  }

  // 创建PDF文档 (A4尺寸: 210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // 注册中文字体（必须在创建doc后立即注册）
  doc.addFileToVFS('NotoSansSC-Regular.ttf', fontRegularBase64)
  doc.addFont('NotoSansSC-Regular.ttf', 'NotoSansSC', 'normal')
  doc.addFileToVFS('NotoSansSC-Bold.ttf', fontBoldBase64)
  doc.addFont('NotoSansSC-Bold.ttf', 'NotoSansSC', 'bold')
  
  // 设置默认字体为中文
  doc.setFont('NotoSansSC', 'normal')

  const pageWidth = 210
  const pageHeight = 297
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let yPos = margin

  // 获取报告内容
  const reportContent = generateReportContent(lang, scores, domainLabel)
  const parsedAI = parseAIAnalysis(aiAnalysis || '')

  // 辅助函数：检查是否需要新页面
  const checkNewPage = (requiredSpace = 20) => {
    if (yPos > pageHeight - requiredSpace) {
      doc.addPage()
      yPos = margin
      return true
    }
    return false
  }

  // 辅助函数：添加标题
  const addTitle = (text, fontSize = 16, isBold = true) => {
    checkNewPage(30)
    doc.setFontSize(fontSize)
    doc.setFont('NotoSansSC', isBold ? 'bold' : 'normal')
    doc.setTextColor(31, 41, 55) // #1f2937
    doc.text(text, pageWidth / 2, yPos, { align: 'center' })
    yPos += fontSize / 2 + 4
  }

  // 辅助函数：添加小标题
  const addSubtitle = (text, fontSize = 12) => {
    checkNewPage(25)
    doc.setFontSize(fontSize)
    doc.setFont('NotoSansSC', 'bold')
    doc.setTextColor(31, 41, 55)
    doc.text(text, margin, yPos)
    yPos += 8
  }

  // 辅助函数：添加正文
  const addText = (text, fontSize = 10, color = [75, 85, 99], align = 'left') => {
    if (!text) return
    doc.setFontSize(fontSize)
    doc.setFont('NotoSansSC', 'normal')
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, contentWidth)
    lines.forEach((line) => {
      checkNewPage(15)
      doc.text(line, align === 'center' ? pageWidth / 2 : margin, yPos, { align })
      yPos += 5
    })
    yPos += 3
  }

  // 辅助函数：添加列表项
  const addBulletPoint = (text, fontSize = 10) => {
    checkNewPage(15)
    doc.setFontSize(fontSize)
    doc.setFont('NotoSansSC', 'normal')
    doc.setTextColor(75, 85, 99)
    const lines = doc.splitTextToSize(`• ${text}`, contentWidth - 5)
    lines.forEach((line, idx) => {
      if (idx > 0) checkNewPage(15)
      doc.text(line, margin + 5, yPos)
      yPos += 5
    })
    yPos += 2
  }

  // ============================================
  // 🟦 封面
  // ============================================
  // Logo区域 - 加载并添加logo图片
  // 尝试多个可能的logo路径（支持src/assets和public目录）
  const logoPaths = [
    logoImageUrl, // 从import导入的路径（src/assets）
    '/jx_adhd_logo.jpg', // public目录路径
    './jx_adhd_logo.jpg' // 相对路径
  ]

  // 在logo之前添加顶部间距
  yPos += 15

  let logoLoaded = false
  for (const logoPath of logoPaths) {
    try {
      // 加载logo图片并转换为base64
      const logoResponse = await fetch(logoPath)
      if (!logoResponse.ok) continue
      
      const logoBlob = await logoResponse.blob()
      const logoBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(logoBlob)
      })

      // 获取图片的实际尺寸以保持正确的宽高比
      const getImageDimensions = (base64) => {
        return new Promise((resolve, reject) => {
          const img = new Image()
          img.onload = () => {
            resolve({ width: img.width, height: img.height })
          }
          img.onerror = reject
          img.src = base64
        })
      }

      const imageDimensions = await getImageDimensions(logoBase64)
      const imageAspectRatio = imageDimensions.width / imageDimensions.height

      // Logo尺寸（mm）- 保持原始宽高比，放大到2倍
      const logoHeight = 50 // 高度50mm（原来的2倍）
      const logoWidth = logoHeight * imageAspectRatio // 根据实际图片比例计算宽度
      
      // 计算居中位置
      const logoX = (pageWidth - logoWidth) / 2
      const logoY = yPos

      // 添加logo图片到PDF
      doc.addImage(logoBase64, 'JPEG', logoX, logoY, logoWidth, logoHeight)
      
      yPos += logoHeight + 8
      logoLoaded = true
      break // 成功加载后退出循环
    } catch (error) {
      // 继续尝试下一个路径
      continue
    }
  }

  // 如果所有路径都失败，使用文字替代
  if (!logoLoaded) {
    if (import.meta.env.DEV) {
      console.warn('无法加载logo图片，使用文字替代')
    }
    doc.setFontSize(16)
    doc.setTextColor(31, 41, 55)
    doc.setFont('NotoSansSC', 'normal')
    doc.text('聚心ADHD', pageWidth / 2, yPos, { align: 'center' })
    yPos += 12
  }

  // 标题
  addTitle(reportContent.cover.title, 18, true)
  yPos += 2

  // 副标题
  addText(reportContent.cover.subtitle, 11, [107, 114, 128], 'center')
  yPos += 4

  // 日期
  addText(reportContent.cover.date, 10, [156, 163, 175], 'center')
  yPos += 26

  // ============================================
  // 🟦 01 使用说明 & 安心声明（放在封面页下半部，小字体紧凑版）
  // ============================================
  // 检查是否有足够空间，如果没有则换页
  if (yPos > pageHeight - 60) {
    doc.addPage()
    yPos = margin
  }

  // 小字体标题
  doc.setFontSize(10)
  doc.setFont('NotoSansSC', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text(reportContent.disclaimer.title, margin, yPos)
  yPos += 5

  // 小字体列表项
  doc.setFontSize(8)
  doc.setFont('NotoSansSC', 'normal')
  doc.setTextColor(75, 85, 99)
  reportContent.disclaimer.points.forEach(point => {
    checkNewPage(10)
    const lines = doc.splitTextToSize(`• ${point}`, contentWidth - 5)
    lines.forEach((line, idx) => {
      doc.text(line, margin + 5, yPos)
      yPos += 3.5
    })
    yPos += 1
  })

  yPos += 2
  // 关键声明（小字体）- 如果存在则显示
  if (reportContent.disclaimer.keyStatement) {
    doc.setFontSize(8)
    doc.setTextColor(74, 124, 122) // #4a7c7a - 深cyan文字色
    const keyStatementLines = doc.splitTextToSize(reportContent.disclaimer.keyStatement, contentWidth - 10)
    keyStatementLines.forEach(line => {
      checkNewPage(10)
      doc.text(line, margin + 5, yPos)
      yPos += 3.5
    })
    yPos += 10
  } else {
    yPos += 5
  }

  // ============================================
  // 🟦 02 本次评估结果概览 和 AI 综合理解（并在一起）
  // ============================================
  checkNewPage(65)
  addSubtitle(reportContent.overview.title, 14)
  yPos += 2

  addText(reportContent.overview.intro, 10)
  yPos += 6

  // 各维度得分
  Object.entries(scores).forEach(([domain, detail], idx) => {
    const dim = reportContent.overview.dimensions.find(d => d.name === domainLabel(domain)) || reportContent.overview.dimensions[idx]
    if (!dim) return

    checkNewPage(35)
    doc.setFontSize(11)
    doc.setFont('NotoSansSC', 'bold')
    doc.setTextColor(31, 41, 55)
    doc.text(domainLabel(domain), margin, yPos)
    
    doc.setFont('NotoSansSC', 'normal')
    doc.setTextColor(107, 114, 128)
    const scoreText = `${translations.result.averageScore || '平均分'} ${detail.average} - ${detail.label}`
    doc.text(scoreText, margin + 80, yPos)
    yPos += 6

    // 绘制滑动条（使用网页的柔和颜色，更纤细精致）
    const sliderWidth = contentWidth
    const sliderHeight = 2.5 // mm - 更细
    const sliderY = yPos
    const sliderX = margin
    
    // 滑动条背景（灰色，与网页一致）
    doc.setFillColor(229, 231, 235) // #e5e7eb
    doc.rect(sliderX, sliderY, sliderWidth, sliderHeight, 'F')
    
    // 分段颜色区域（每个25%，使用网页的柔和颜色）
    const segmentWidth = sliderWidth / 4
    
    // 正常范围 (0-0.75) - 浅绿色（与网页一致）
    doc.setFillColor(220, 252, 231) // #dcfce7
    doc.rect(sliderX, sliderY, segmentWidth, sliderHeight, 'F')
    
    // 轻微 (0.75-1.5) - 浅黄色（与网页一致）
    doc.setFillColor(254, 243, 199) // #fef3c7
    doc.rect(sliderX + segmentWidth, sliderY, segmentWidth, sliderHeight, 'F')
    
    // 中度 (1.5-2.25) - 浅红色（与网页一致）
    doc.setFillColor(254, 226, 226) // #fee2e2
    doc.rect(sliderX + segmentWidth * 2, sliderY, segmentWidth, sliderHeight, 'F')
    
    // 显著 (2.25-3) - 浅粉红色（与网页一致）
    doc.setFillColor(254, 202, 202) // #fecaca
    doc.rect(sliderX + segmentWidth * 3, sliderY, segmentWidth, sliderHeight, 'F')
    
    // 绘制指示器（黑色竖线，适当加粗）
    const indicatorPosition = Math.min((detail.average / 3) * sliderWidth, sliderWidth)
    const indicatorX = sliderX + indicatorPosition
    
    // 绘制指示器（黑色竖线，宽度0.6mm，高度比滑动条稍高）
    const indicatorWidth = 0.6 // mm - 适当加粗
    const indicatorHeight = sliderHeight + 1.5 // 比滑动条高1.5mm
    const indicatorY = sliderY - 0.75 // 向上偏移，使竖线居中在滑动条上
    
    doc.setFillColor(0, 0, 0) // 黑色
    doc.rect(indicatorX - indicatorWidth / 2, indicatorY, indicatorWidth, indicatorHeight, 'F')
    
    // 绘制刻度标签 (0, 1, 2, 3) - 更小
    yPos += sliderHeight + 2.5
    doc.setFontSize(7)
    doc.setFont('NotoSansSC', 'normal')
    doc.setTextColor(156, 163, 175) // #9ca3af - 与网页一致
    for (let i = 0; i <= 3; i++) {
      const labelX = sliderX + (i / 3) * sliderWidth
      doc.text(i.toString(), labelX, yPos, { align: 'center' })
    }
    yPos += 3.5

    // 描述文本
    doc.setFontSize(9)
    doc.setTextColor(75, 85, 99)
    const descLines = doc.splitTextToSize(detail.desc, contentWidth)
    descLines.forEach(line => {
      doc.text(line, margin + 5, yPos)
      yPos += 4
    })
    yPos += 4
  })

  yPos += 7

  // AI 综合理解（紧接着结果概览）
  if (parsedAI.overall || aiAnalysis) {
    checkNewPage(52)
    addSubtitle(reportContent.aiAnalysis.title, 14)
    yPos += 2

    addText(reportContent.aiAnalysis.note, 9, [107, 114, 128])
    yPos += 4

    // 如果有解析后的整体理解，优先使用；否则使用完整AI分析
    const aiContent = parsedAI.overall || aiAnalysis
    if (aiContent) {
      addText(aiContent, 10)
      yPos += 7
    }
  }

  // ============================================
  // 🟦 03 SNAP-IV分维度理解
  // ============================================
  if (parsedAI.dimensions) {
    checkNewPage(52)
    addSubtitle(reportContent.dimensionInterpretation.title, 14)
    yPos += 2

    addText(reportContent.dimensionInterpretation.note, 9, [107, 114, 128])
    yPos += 4

    addText(parsedAI.dimensions, 10)
    yPos += 7
  }

  // ============================================
  // 🟦 04 家庭支持建议 和 给孩子的话（并在一起）
  // ============================================
  if (parsedAI.familySupport) {
    checkNewPage(52)
    addSubtitle(reportContent.familySupport.title, 14)
    yPos += 2

    addText(parsedAI.familySupport, 10)
    yPos += 7
  }

  // 给孩子的话（紧接着家庭支持建议）
  if (parsedAI.messageToChild) {
    checkNewPage(52)
    // 移除背景色，使用普通样式
    addSubtitle(lang === 'zh' ? '给孩子的话' : 'A Message for the Child', 12)
    yPos += 2
    
    addText(parsedAI.messageToChild, 10) // 使用默认文字颜色
    yPos += 7
  }

  // ============================================
  // 🟦 05 专业说明（小字体）
  // ============================================
  checkNewPage(78)
  doc.setFontSize(12) // 小字体标题
  doc.setFont('NotoSansSC', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text(reportContent.professionalNote.title, margin, yPos)
  yPos += 6

  doc.setFontSize(9) // 小字体正文
  doc.setFont('NotoSansSC', 'normal')
  doc.setTextColor(107, 114, 128)
  const disclaimerLines = doc.splitTextToSize(reportContent.professionalNote.disclaimer, contentWidth)
  disclaimerLines.forEach(line => {
    checkNewPage(15)
    doc.text(line, margin, yPos)
    yPos += 4
  })
  yPos += 4

  // 关于专业咨询（如果AI有提供）
  if (parsedAI.professionalConsultation) {
    // 确保使用中文字体
    doc.setFontSize(9)
    doc.setFont('NotoSansSC', 'normal')
    doc.setTextColor(107, 114, 128)
    const consultationLines = doc.splitTextToSize(parsedAI.professionalConsultation, contentWidth)
    consultationLines.forEach(line => {
      checkNewPage(15)
      doc.text(line, margin, yPos)
      yPos += 4
    })
    yPos += 3
  }

  yPos += 8

  // ============================================
  // 🟦 附录：SNAP-IV 是什么？（小字体）
  // ============================================
  checkNewPage(65)
  doc.setFontSize(11) // 小字体标题
  doc.setFont('NotoSansSC', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text(reportContent.aboutSnap.title, margin, yPos)
  yPos += 6

  doc.setFontSize(9) // 小字体正文
  doc.setFont('NotoSansSC', 'normal')
  doc.setTextColor(75, 85, 99)
  const introLines = doc.splitTextToSize(reportContent.aboutSnap.introduction, contentWidth)
  introLines.forEach(line => {
    doc.text(line, margin, yPos)
    yPos += 4
  })
  yPos += 4

  doc.setFontSize(9)
  doc.setFont('NotoSansSC', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text(lang === 'zh' ? '它能做什么：' : 'What it can do:', margin, yPos)
  yPos += 5
  doc.setFont('NotoSansSC', 'normal')
  doc.setTextColor(75, 85, 99)
  reportContent.aboutSnap.canDo.forEach(item => {
    const itemLines = doc.splitTextToSize(`• ${item}`, contentWidth - 5)
    itemLines.forEach(line => {
      doc.text(line, margin + 5, yPos)
      yPos += 4
    })
    yPos += 1
  })

  yPos += 3
  doc.setFont('NotoSansSC', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text(lang === 'zh' ? '它不能做什么：' : 'What it cannot do:', margin, yPos)
  yPos += 5
  doc.setFont('NotoSansSC', 'normal')
  doc.setTextColor(75, 85, 99)
  reportContent.aboutSnap.cannotDo.forEach(item => {
    const itemLines = doc.splitTextToSize(`• ${item}`, contentWidth - 5)
    itemLines.forEach(line => {
      doc.text(line, margin + 5, yPos)
      yPos += 4
    })
    yPos += 1
  })

  yPos += 4
  doc.setFontSize(8)
  doc.setFont('NotoSansSC', 'normal')
  doc.setTextColor(107, 114, 128)
  const noteLines = doc.splitTextToSize(reportContent.aboutSnap.professionalNote, contentWidth)
  noteLines.forEach(line => {
    checkNewPage(15)
    doc.text(line, margin, yPos)
    yPos += 3
  })

  yPos += 8

  // ============================================
  // 🟦 参考文献（放在最后）
  // ============================================
  checkNewPage(52)
  doc.setFontSize(10)
  doc.setFont('NotoSansSC', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text(lang === 'zh' ? '参考文献' : 'References', margin, yPos)
  yPos += 6

  doc.setFontSize(9)
  doc.setFont('NotoSansSC', 'normal')
  doc.setTextColor(107, 114, 128)
  reportContent.professionalNote.references.forEach(ref => {
    checkNewPage(15)
    const refLines = doc.splitTextToSize(ref, contentWidth)
    refLines.forEach(line => {
      doc.text(line, margin + 5, yPos)
      yPos += 4
    })
    yPos += 2
  })

  // ============================================
  // 生成文件名并保存（使用Blob方式，兼容移动端）
  // ============================================
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD
  const timeStr = now.toTimeString().slice(0, 5).replace(':', '') // HHMM
  const filename = `SNAP-IV-Report-${dateStr}-${timeStr}.pdf`

  // 使用Blob方式下载，兼容移动端浏览器
  try {
    const pdfBlob = doc.output('blob')
    const url = URL.createObjectURL(pdfBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    // 添加到DOM，触发下载，然后移除
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // 清理URL对象（延迟清理，确保下载开始）
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 100)
  } catch (error) {
    // 如果Blob方式失败，回退到原始方式
    if (import.meta.env.DEV) {
      console.warn('Blob download failed, falling back to doc.save():', error)
    }
    doc.save(filename)
  }
}
