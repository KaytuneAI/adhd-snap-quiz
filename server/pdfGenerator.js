// server/pdfGenerator.js
// 服务器端 PDF 生成器（复用客户端逻辑，但适配 Node.js 环境）

import { jsPDF } from 'jspdf'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 字体文件路径（服务器端直接读取 TTF 文件）
const FONT_REGULAR_PATH = join(__dirname, '../src/fonts/static/NotoSansSC-Regular.ttf')
const FONT_BOLD_PATH = join(__dirname, '../src/fonts/static/NotoSansSC-Bold.ttf')
const LOGO_PATH = join(__dirname, '../src/assets/logos/jx_adhd_logo.jpg')

// 缓存字体（避免重复读取）
let fontRegularBase64 = null
let fontBoldBase64 = null
let logoBase64 = null

/**
 * 读取字体文件并转换为 base64
 */
function loadFonts() {
  if (!fontRegularBase64) {
    fontRegularBase64 = readFileSync(FONT_REGULAR_PATH).toString('base64')
  }
  if (!fontBoldBase64) {
    fontBoldBase64 = readFileSync(FONT_BOLD_PATH).toString('base64')
  }
}

/**
 * 读取 Logo 图片并转换为 base64
 */
function loadLogo() {
  if (!logoBase64) {
    try {
      const logoBuffer = readFileSync(LOGO_PATH)
      logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Failed to load logo:', error)
      }
      logoBase64 = null
    }
  }
  return logoBase64
}

/**
 * 生成报告内容（服务器端版本，不依赖 getTranslations）
 */
function generateReportContent(lang, scores, translations) {
  const isZh = lang === 'zh'
  const t = translations || {}
  const domains = t.result?.domains || {}

  // domainLabel 函数
  const domainLabel = (domain) => domains[domain] || domain

  return {
    cover: {
      title: isZh 
        ? 'SNAP-IV 行为特征初步理解报告'
        : 'SNAP-IV Behavioral Characteristics Preliminary Understanding Report',
      subtitle: isZh
        ? '面向家庭的支持型解读（非医学诊断）'
        : 'Family-Oriented Supportive Interpretation (Not a Medical Diagnosis)',
      date: new Date().toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },
    disclaimer: {
      title: isZh
        ? '在阅读这份报告前，请先了解这些重要信息'
        : 'Important Information Before Reading This Report',
      points: isZh ? [
        '本报告基于 SNAP-IV 行为筛查量表',
        '反映的是行为特征的"倾向与强度"',
        '不构成医学诊断，也不等同于临床结论'
      ] : [
        'This report is based on the SNAP-IV behavioral screening scale',
        'It reflects the "tendency and intensity" of behavioral characteristics',
        'It does not constitute a medical diagnosis or clinical conclusion'
      ],
      keyStatement: ''
    },
    aboutSnap: {
      title: isZh ? 'SNAP-IV 是什么？' : 'What is SNAP-IV?',
      introduction: isZh
        ? 'SNAP-IV 是一套国际广泛使用的行为筛查量表，常用于了解儿童在注意力、多动冲动、情绪与行为调节方面的表现。'
        : 'SNAP-IV is an internationally widely used behavioral screening scale, commonly used to understand children\'s performance in attention, hyperactivity/impulsivity, and emotional/behavioral regulation.',
      canDo: isZh ? [
        '识别需要更多支持的行为模式',
        '帮助家庭与学校理解孩子'
      ] : [
        'Identify behavioral patterns that need more support',
        'Help families and schools understand children'
      ],
      cannotDo: isZh ? [
        '不能单独用于诊断',
        '不能替代专业临床评估'
      ] : [
        'Cannot be used alone for diagnosis',
        'Cannot replace professional clinical assessment'
      ],
      professionalNote: isZh
        ? 'SNAP-IV 基于 DSM（精神障碍诊断与统计手册）相关行为条目发展而来，被广泛用于研究与临床前筛查。'
        : 'SNAP-IV was developed based on behavioral items related to the DSM (Diagnostic and Statistical Manual of Mental Disorders) and is widely used in research and pre-clinical screening.'
    },
    overview: {
      title: isZh ? '本次评估结果概览' : 'Assessment Results Overview',
      intro: isZh
        ? '本次结果显示，孩子在不同维度上呈现出不同程度的行为特点。这些特点在成长过程中是可以被理解、支持和逐步调节的。'
        : 'The results show that the child exhibits behavioral characteristics of varying degrees across different dimensions. These characteristics can be understood, supported, and gradually regulated during growth.',
      dimensions: Object.entries(scores).map(([domain, detail]) => ({
        name: domainLabel(domain),
        average: detail.average,
        label: detail.label,
        desc: detail.desc
      }))
    },
    dimensionInterpretation: {
      title: isZh ? '分维度理解' : 'Dimension-by-Dimension Understanding',
      note: isZh
        ? '以下内容基于量表结果，结合AI辅助分析生成。'
        : 'The following content is generated based on scale results and AI-assisted analysis.'
    },
    aiAnalysis: {
      title: isZh ? 'AI 综合理解（支持型解读）' : 'AI Comprehensive Understanding (Supportive Interpretation)',
      note: isZh
        ? '以下内容由 AI 辅助生成，基于量表结果进行整合性理解，供家庭参考。'
        : 'The following content is AI-assisted and generated based on scale results for integrated understanding, for family reference.'
    },
    familySupport: {
      title: isZh ? '家庭支持建议' : 'Family Support Recommendations'
    },
    professionalNote: {
      title: isZh ? '专业说明 & 参考文献' : 'Professional Notes & References',
      disclaimer: isZh
        ? '本报告基于 SNAP-IV 行为筛查量表及 AI 辅助分析生成，仅用于行为理解与家庭支持参考，不构成医学诊断或治疗建议。'
        : 'This report is generated based on the SNAP-IV behavioral screening scale and AI-assisted analysis, for behavioral understanding and family support reference only. It does not constitute medical diagnosis or treatment recommendations.',
      references: isZh ? [
        'Swanson, J. M., et al. (2001). The SNAP-IV Teacher and Parent Rating Scale.',
        'American Psychiatric Association. DSM-5.',
        'Barkley, R. A. Attention-Deficit Hyperactivity Disorder: A Handbook for Diagnosis and Treatment.'
      ] : [
        'Swanson, J. M., et al. (2001). The SNAP-IV Teacher and Parent Rating Scale.',
        'American Psychiatric Association. DSM-5.',
        'Barkley, R. A. Attention-Deficit Hyperactivity Disorder: A Handbook for Diagnosis and Treatment.'
      ]
    }
  }
}

/**
 * 解析 AI 分析文本
 */
function parseAIAnalysis(aiAnalysis) {
  if (!aiAnalysis || !aiAnalysis.trim()) {
    return {
      overall: '',
      dimensions: '',
      familySupport: '',
      professionalConsultation: '',
      messageToChild: ''
    }
  }

  const sections = {
    overall: '',
    dimensions: '',
    familySupport: '',
    professionalConsultation: '',
    messageToChild: ''
  }

  const patterns = {
    overall: /【一、整体理解】([\s\S]*?)(?=【二、|━━|$)/,
    dimensions: /【二、分维度解读】([\s\S]*?)(?=【三、|━━|$)/,
    familySupport: /【三、家庭支持建议】([\s\S]*?)(?=【四、|━━|$)/,
    messageToChild: /【四、给孩子的话】([\s\S]*?)(?=【五、|━━|$)/,
    professionalConsultation: /【五、关于专业咨询】([\s\S]*?)(?=━━|$|【)/
  }

  if (!aiAnalysis.includes('【一、')) {
    return {
      overall: aiAnalysis,
      dimensions: '',
      familySupport: '',
      professionalConsultation: '',
      messageToChild: ''
    }
  }

  Object.entries(patterns).forEach(([key, pattern]) => {
    const match = aiAnalysis.match(pattern)
    if (match && match[1]) {
      sections[key] = match[1].trim()
    }
  })

  return sections
}

/**
 * 生成 PDF（服务器端版本）
 * @param {Object} options
 * @param {Object} options.scores - 分数对象
 * @param {string} options.aiAnalysis - AI分析文本
 * @param {string} options.lang - 语言 ('zh' 或 'en')
 * @param {Object} options.translations - 翻译对象
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generatePDF({ scores, aiAnalysis, lang = 'zh', translations = {} }) {
  // 加载字体
  loadFonts()
  
  // 创建 PDF 文档
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // 注册中文字体
  doc.addFileToVFS('NotoSansSC-Regular.ttf', fontRegularBase64)
  doc.addFont('NotoSansSC-Regular.ttf', 'NotoSansSC', 'normal')
  doc.addFileToVFS('NotoSansSC-Bold.ttf', fontBoldBase64)
  doc.addFont('NotoSansSC-Bold.ttf', 'NotoSansSC', 'bold')
  doc.setFont('NotoSansSC', 'normal')

  const pageWidth = 210
  const pageHeight = 297
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let yPos = margin

  // 生成报告内容
  const reportContent = generateReportContent(lang, scores, translations)
  const parsedAI = parseAIAnalysis(aiAnalysis || '')
  const domains = translations?.result?.domains || {}
  const domainLabel = (domain) => domains[domain] || domain

  // 辅助函数
  const checkNewPage = (requiredSpace = 20) => {
    if (yPos > pageHeight - requiredSpace) {
      doc.addPage()
      yPos = margin
      return true
    }
    return false
  }

  const addTitle = (text, fontSize = 16, isBold = true) => {
    checkNewPage(30 * 1.3)
    doc.setFontSize(fontSize)
    doc.setFont('NotoSansSC', isBold ? 'bold' : 'normal')
    doc.setTextColor(31, 41, 55)
    doc.text(text, pageWidth / 2, yPos, { align: 'center' })
    yPos += (fontSize / 2 + 4) * 1.3
  }

  const addSubtitle = (text, fontSize = 12) => {
    checkNewPage(25 * 1.3)
    doc.setFontSize(fontSize)
    doc.setFont('NotoSansSC', 'bold')
    doc.setTextColor(31, 41, 55)
    doc.text(text, margin, yPos)
    yPos += 8 * 1.3
  }

  const addText = (text, fontSize = 10, color = [75, 85, 99], align = 'left') => {
    if (!text) return
    checkNewPage(15 * 1.3)
    doc.setFontSize(fontSize)
    doc.setFont('NotoSansSC', 'normal')
    doc.setTextColor(color[0], color[1], color[2])
    const lines = doc.splitTextToSize(text, contentWidth)
    lines.forEach(line => {
      checkNewPage(15 * 1.3)
      doc.text(line, align === 'center' ? pageWidth / 2 : margin, yPos, { align })
      yPos += 5 * 1.3
    })
    yPos += 3 * 1.3
  }

  const addBulletPoint = (text, fontSize = 10) => {
    checkNewPage(15 * 1.3)
    doc.setFontSize(fontSize)
    doc.setFont('NotoSansSC', 'normal')
    doc.setTextColor(75, 85, 99)
    const lines = doc.splitTextToSize(`• ${text}`, contentWidth - 5)
    lines.forEach((line, idx) => {
      if (idx > 0) checkNewPage(15 * 1.3)
      doc.text(line, margin + 5, yPos)
      yPos += 5 * 1.3
    })
    yPos += 2 * 1.3
  }

  // ============================================
  // 🟦 封面
  // ============================================
  yPos += 15

  // 加载并添加 Logo
  const logoBase64 = loadLogo()
  if (logoBase64) {
    try {
      // 使用 sharp 获取图片的实际尺寸以保持正确的宽高比
      const logoBuffer = readFileSync(LOGO_PATH)
      const imageMetadata = await sharp(logoBuffer).metadata()
      const imageAspectRatio = imageMetadata.width / imageMetadata.height

      // Logo尺寸（mm）- 保持原始宽高比
      const logoHeight = 50 // 高度50mm
      const logoWidth = logoHeight * imageAspectRatio // 根据实际图片比例计算宽度
      const logoX = (pageWidth - logoWidth) / 2
      
      doc.addImage(logoBase64, 'JPEG', logoX, yPos, logoWidth, logoHeight)
      yPos += logoHeight + 8 * 1.3
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Failed to add logo to PDF:', error)
      }
    }
  }

  if (!logoBase64) {
    doc.setFontSize(16)
    doc.setTextColor(31, 41, 55)
    doc.setFont('NotoSansSC', 'normal')
    doc.text('聚心ADHD', pageWidth / 2, yPos, { align: 'center' })
    yPos += 12 * 1.3
  }

  addTitle(reportContent.cover.title, 18, true)
  yPos += 2 * 1.3
  addText(reportContent.cover.subtitle, 11, [107, 114, 128], 'center')
  yPos += 4 * 1.3
  addText(reportContent.cover.date, 10, [156, 163, 175], 'center')
  yPos += 20 * 1.3

  // ============================================
  // 🟦 01 使用说明 & 安心声明
  // ============================================
  if (yPos > pageHeight - 60 * 1.3) {
    doc.addPage()
    yPos = margin
  }

  doc.setFontSize(10)
  doc.setFont('NotoSansSC', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text(reportContent.disclaimer.title, margin, yPos)
  yPos += 5 * 1.3

  doc.setFontSize(8)
  doc.setFont('NotoSansSC', 'normal')
  doc.setTextColor(75, 85, 99)
  reportContent.disclaimer.points.forEach(point => {
    checkNewPage(10 * 1.3)
    const lines = doc.splitTextToSize(`• ${point}`, contentWidth - 5)
    lines.forEach((line, idx) => {
      doc.text(line, margin + 5, yPos)
      yPos += 3.5 * 1.3
    })
    yPos += 1 * 1.3
  })

  yPos += 4 * 1.3

  // ============================================
  // 🟦 02 本次评估结果概览 和 AI 综合理解
  // ============================================
  checkNewPage(50 * 1.3)
  addSubtitle(reportContent.overview.title, 14)
  yPos += 2 * 1.3

  addText(reportContent.overview.intro, 10)
  yPos += 6 * 1.3

  // 各维度得分
  Object.entries(scores).forEach(([domain, detail], idx) => {
    const dim = reportContent.overview.dimensions.find(d => d.name === domainLabel(domain)) || reportContent.overview.dimensions[idx]
    if (!dim) return

    checkNewPage(35 * 1.3)
    doc.setFontSize(11)
    doc.setFont('NotoSansSC', 'bold')
    doc.setTextColor(31, 41, 55)
    doc.text(domainLabel(domain), margin, yPos)
    
    doc.setFont('NotoSansSC', 'normal')
    doc.setTextColor(107, 114, 128)
    const scoreText = `${translations.result?.averageScore || '平均分'} ${detail.average} - ${detail.label}`
    doc.text(scoreText, margin + 80, yPos)
    yPos += 6 * 1.3

    // 绘制滑动条
    const sliderWidth = contentWidth
    const sliderHeight = 2.5
    const sliderY = yPos
    const sliderX = margin
    
    doc.setFillColor(229, 231, 235)
    doc.rect(sliderX, sliderY, sliderWidth, sliderHeight, 'F')
    
    const segmentWidth = sliderWidth / 4
    doc.setFillColor(220, 252, 231)
    doc.rect(sliderX, sliderY, segmentWidth, sliderHeight, 'F')
    doc.setFillColor(254, 243, 199)
    doc.rect(sliderX + segmentWidth, sliderY, segmentWidth, sliderHeight, 'F')
    doc.setFillColor(254, 226, 226)
    doc.rect(sliderX + segmentWidth * 2, sliderY, segmentWidth, sliderHeight, 'F')
    doc.setFillColor(254, 202, 202)
    doc.rect(sliderX + segmentWidth * 3, sliderY, segmentWidth, sliderHeight, 'F')
    
    const indicatorPosition = Math.min((detail.average / 3) * sliderWidth, sliderWidth)
    const indicatorX = sliderX + indicatorPosition
    const indicatorWidth = 0.6
    const indicatorHeight = sliderHeight + 1.5
    const indicatorY = sliderY - 0.75
    
    doc.setFillColor(0, 0, 0)
    doc.rect(indicatorX - indicatorWidth / 2, indicatorY, indicatorWidth, indicatorHeight, 'F')
    
    yPos += sliderHeight + 2.5 * 1.3
    doc.setFontSize(7)
    doc.setFont('NotoSansSC', 'normal')
    doc.setTextColor(156, 163, 175)
    for (let i = 0; i <= 3; i++) {
      const labelX = sliderX + (i / 3) * sliderWidth
      doc.text(i.toString(), labelX, yPos, { align: 'center' })
    }
    yPos += 3.5 * 1.3

    doc.setFontSize(9)
    doc.setTextColor(75, 85, 99)
    const descLines = doc.splitTextToSize(detail.desc, contentWidth)
    descLines.forEach(line => {
      doc.text(line, margin + 5, yPos)
      yPos += 4 * 1.3
    })
    yPos += 4 * 1.3
  })

  yPos += 5 * 1.3

  // AI 综合理解
  if (parsedAI.overall || aiAnalysis) {
    checkNewPage(40 * 1.3)
    addSubtitle(reportContent.aiAnalysis.title, 14)
    yPos += 2 * 1.3

    addText(reportContent.aiAnalysis.note, 9, [107, 114, 128])
    yPos += 4 * 1.3

    const aiContent = parsedAI.overall || aiAnalysis
    if (aiContent) {
      addText(aiContent, 10)
      yPos += 5 * 1.3
    }
  }

  // ============================================
  // 🟦 03 SNAP-IV分维度理解
  // ============================================
  if (parsedAI.dimensions) {
    checkNewPage(40 * 1.3)
    addSubtitle(reportContent.dimensionInterpretation.title, 14)
    yPos += 2 * 1.3

    addText(reportContent.dimensionInterpretation.note, 9, [107, 114, 128])
    yPos += 4 * 1.3

    addText(parsedAI.dimensions, 10)
    yPos += 5 * 1.3
  }

  // ============================================
  // 🟦 04 家庭支持建议 和 给孩子的话
  // ============================================
  if (parsedAI.familySupport) {
    checkNewPage(40 * 1.3)
    addSubtitle(reportContent.familySupport.title, 14)
    yPos += 2 * 1.3

    addText(parsedAI.familySupport, 10)
    yPos += 5 * 1.3
  }

  if (parsedAI.messageToChild) {
    checkNewPage(40 * 1.3)
    // 移除背景色，使用普通样式
    addSubtitle(lang === 'zh' ? '给孩子的话' : 'A Message for the Child', 12)
    yPos += 2 * 1.3
    
    addText(parsedAI.messageToChild, 10) // 使用默认文字颜色
    yPos += 5 * 1.3
  }

  // ============================================
  // 🟦 05 专业说明
  // ============================================
  checkNewPage(60 * 1.3)
  doc.setFontSize(12)
  doc.setFont('NotoSansSC', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text(reportContent.professionalNote.title, margin, yPos)
  yPos += 6 * 1.3

  doc.setFontSize(9)
  doc.setFont('NotoSansSC', 'normal')
  doc.setTextColor(107, 114, 128)
  const disclaimerLines = doc.splitTextToSize(reportContent.professionalNote.disclaimer, contentWidth)
  disclaimerLines.forEach(line => {
    checkNewPage(15 * 1.3)
    doc.text(line, margin, yPos)
    yPos += 4 * 1.3
  })
  yPos += 4 * 1.3

  if (parsedAI.professionalConsultation) {
    doc.setFontSize(9)
    doc.setFont('NotoSansSC', 'normal')
    doc.setTextColor(107, 114, 128)
    const consultationLines = doc.splitTextToSize(parsedAI.professionalConsultation, contentWidth)
    consultationLines.forEach(line => {
      checkNewPage(15 * 1.3)
      doc.text(line, margin, yPos)
      yPos += 4 * 1.3
    })
    yPos += 3 * 1.3
  }

  yPos += 6 * 1.3

  // ============================================
  // 🟦 附录：SNAP-IV 是什么？
  // ============================================
  checkNewPage(50 * 1.3)
  doc.setFontSize(11)
  doc.setFont('NotoSansSC', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text(reportContent.aboutSnap.title, margin, yPos)
  yPos += 6 * 1.3

  doc.setFontSize(9)
  doc.setFont('NotoSansSC', 'normal')
  doc.setTextColor(75, 85, 99)
  const introLines = doc.splitTextToSize(reportContent.aboutSnap.introduction, contentWidth)
  introLines.forEach(line => {
    doc.text(line, margin, yPos)
    yPos += 4 * 1.3
  })
  yPos += 4 * 1.3

  doc.setFontSize(9)
  doc.setFont('NotoSansSC', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text(lang === 'zh' ? '它能做什么：' : 'What it can do:', margin, yPos)
  yPos += 5 * 1.3
  doc.setFont('NotoSansSC', 'normal')
  doc.setTextColor(75, 85, 99)
  reportContent.aboutSnap.canDo.forEach(item => {
    const itemLines = doc.splitTextToSize(`• ${item}`, contentWidth - 5)
    itemLines.forEach(line => {
      doc.text(line, margin + 5, yPos)
      yPos += 4 * 1.3
    })
    yPos += 1 * 1.3
  })

  yPos += 3 * 1.3
  doc.setFont('NotoSansSC', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text(lang === 'zh' ? '它不能做什么：' : 'What it cannot do:', margin, yPos)
  yPos += 5 * 1.3
  doc.setFont('NotoSansSC', 'normal')
  doc.setTextColor(75, 85, 99)
  reportContent.aboutSnap.cannotDo.forEach(item => {
    const itemLines = doc.splitTextToSize(`• ${item}`, contentWidth - 5)
    itemLines.forEach(line => {
      doc.text(line, margin + 5, yPos)
      yPos += 4 * 1.3
    })
    yPos += 1 * 1.3
  })

  yPos += 4 * 1.3
  doc.setFontSize(8)
  doc.setFont('NotoSansSC', 'normal')
  doc.setTextColor(107, 114, 128)
  const noteLines = doc.splitTextToSize(reportContent.aboutSnap.professionalNote, contentWidth)
  noteLines.forEach(line => {
    checkNewPage(15 * 1.3)
    doc.text(line, margin, yPos)
    yPos += 3 * 1.3
  })

  yPos += 6 * 1.3

  // ============================================
  // 🟦 参考文献
  // ============================================
  checkNewPage(40 * 1.3)
  doc.setFontSize(10)
  doc.setFont('NotoSansSC', 'bold')
  doc.setTextColor(31, 41, 55)
  doc.text(lang === 'zh' ? '参考文献' : 'References', margin, yPos)
  yPos += 6 * 1.3

  doc.setFontSize(9)
  doc.setFont('NotoSansSC', 'normal')
  doc.setTextColor(107, 114, 128)
  reportContent.professionalNote.references.forEach(ref => {
    checkNewPage(15 * 1.3)
    const refLines = doc.splitTextToSize(ref, contentWidth)
    refLines.forEach(line => {
      doc.text(line, margin + 5, yPos)
      yPos += 4 * 1.3
    })
    yPos += 2 * 1.3
  })

  // 返回 PDF buffer
  return Buffer.from(doc.output('arraybuffer'))
}

