// src/utils/reportContent.js
// 报告内容生成工具 - 统一管理各模块文案

import { getTranslations } from './translations'

/**
 * 生成报告各模块的静态内容
 * @param {string} lang - 语言 ('zh' 或 'en')
 * @param {Object} scores - 分数对象
 * @param {Function} domainLabel - 域名标签函数
 * @returns {Object} 包含各模块内容的对象
 */
export function generateReportContent(lang = 'zh', scores = {}, domainLabel = (d) => d) {
  const t = getTranslations(lang)
  const isZh = lang === 'zh'

  return {
    // 封面
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

    // 01 使用说明 & 安心声明
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

    // 02 SNAP-IV 是什么
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

    // 03 结果概览
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

    // 04 维度解读（这部分会由AI生成，这里只提供结构说明）
    dimensionInterpretation: {
      title: isZh ? '分维度理解' : 'Dimension-by-Dimension Understanding',
      note: isZh
        ? '以下内容基于量表结果，结合AI辅助分析生成。'
        : 'The following content is generated based on scale results and AI-assisted analysis.'
    },

    // 05 AI 综合理解
    aiAnalysis: {
      title: isZh ? 'AI 综合理解（支持型解读）' : 'AI Comprehensive Understanding (Supportive Interpretation)',
      note: isZh
        ? '以下内容由 AI 辅助生成，基于量表结果进行整合性理解，供家庭参考。'
        : 'The following content is AI-assisted and generated based on scale results for integrated understanding, for family reference.'
    },

    // 06 家庭支持建议（这部分会由AI生成，这里只提供结构说明）
    familySupport: {
      title: isZh ? '家庭支持建议' : 'Family Support Recommendations',
      sections: isZh ? [
        '🏠 家庭环境与作息',
        '📚 学习与任务支持',
        '💬 情绪与沟通',
        '🌱 鼓励与成长心态'
      ] : [
        '🏠 Home Environment & Routine',
        '📚 Learning & Task Support',
        '💬 Emotions & Communication',
        '🌱 Encouragement & Growth Mindset'
      ]
    },

    // 07 专业说明 & 参考文献
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
 * 解析AI分析文本，提取结构化内容
 * @param {string} aiAnalysis - AI生成的完整分析文本
 * @returns {Object} 解析后的结构化内容
 */
export function parseAIAnalysis(aiAnalysis) {
  if (!aiAnalysis || !aiAnalysis.trim()) {
    return {
      overall: '',
      dimensions: '',
      familySupport: '',
      professionalConsultation: '',
      messageToChild: ''
    }
  }

  // 尝试按标题分割
  const sections = {
    overall: '',
    dimensions: '',
    familySupport: '',
    professionalConsultation: '',
    messageToChild: ''
  }

  // 匹配各个部分（注意：AI输出顺序是【四、给孩子的话】【五、关于专业咨询】，但显示顺序保持：家庭支持→给孩子的话→专业咨询）
  const patterns = {
    overall: /【一、整体理解】([\s\S]*?)(?=【二、|━━|$)/,
    dimensions: /【二、分维度解读】([\s\S]*?)(?=【三、|━━|$)/,
    familySupport: /【三、家庭支持建议】([\s\S]*?)(?=【四、|━━|$)/,
    messageToChild: /【四、给孩子的话】([\s\S]*?)(?=【五、|━━|$)/,
    professionalConsultation: /【五、关于专业咨询】([\s\S]*?)(?=━━|$|【)/
  }

  // 如果没有找到结构化标记，尝试其他格式
  if (!aiAnalysis.includes('【一、')) {
    // 可能是旧格式，直接返回完整内容
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
 * 实时解析流式输出的内容，提取当前区块的内容
 * @param {string} chunk - 当前接收到的内容块
 * @returns {Object} 解析后的结构化内容（可能部分为空）
 */
export function parseStreamingContent(chunk) {
  if (!chunk || !chunk.trim()) {
    return {
      overall: '',
      dimensions: '',
      familySupport: '',
      messageToChild: '',
      professionalConsultation: ''
    }
  }

  const sections = {
    overall: '',
    dimensions: '',
    familySupport: '',
    messageToChild: '',
    professionalConsultation: ''
  }

  // 检测当前在哪个区块
  const hasOverall = chunk.includes('【一、整体理解】')
  const hasDimensions = chunk.includes('【二、分维度解读】')
  const hasFamilySupport = chunk.includes('【三、家庭支持建议】')
  const hasMessageToChild = chunk.includes('【四、给孩子的话】')
  const hasProfessionalConsultation = chunk.includes('【五、关于专业咨询】')

  // 找到最后一个出现的区块标题，确定当前正在生成哪个区块
  let currentSection = null
  let currentSectionStart = -1

  if (hasProfessionalConsultation) {
    const pos = chunk.lastIndexOf('【五、关于专业咨询】')
    if (pos > currentSectionStart) {
      currentSection = 'professionalConsultation'
      currentSectionStart = pos
    }
  }
  if (hasMessageToChild) {
    const pos = chunk.lastIndexOf('【四、给孩子的话】')
    if (pos > currentSectionStart) {
      currentSection = 'messageToChild'
      currentSectionStart = pos
    }
  }
  if (hasFamilySupport) {
    const pos = chunk.lastIndexOf('【三、家庭支持建议】')
    if (pos > currentSectionStart) {
      currentSection = 'familySupport'
      currentSectionStart = pos
    }
  }
  if (hasDimensions) {
    const pos = chunk.lastIndexOf('【二、分维度解读】')
    if (pos > currentSectionStart) {
      currentSection = 'dimensions'
      currentSectionStart = pos
    }
  }
  if (hasOverall) {
    const pos = chunk.lastIndexOf('【一、整体理解】')
    if (pos > currentSectionStart) {
      currentSection = 'overall'
      currentSectionStart = pos
    }
  }

  // 提取各个区块的内容
  if (hasOverall) {
    const match = chunk.match(/【一、整体理解】([\s\S]*?)(?=【二、|━━|$)/)
    if (match && match[1]) {
      sections.overall = match[1].trim()
    }
  }

  if (hasDimensions) {
    const match = chunk.match(/【二、分维度解读】([\s\S]*?)(?=【三、|━━|$)/)
    if (match && match[1]) {
      sections.dimensions = match[1].trim()
    }
  }

  if (hasFamilySupport) {
    const match = chunk.match(/【三、家庭支持建议】([\s\S]*?)(?=【四、|━━|$)/)
    if (match && match[1]) {
      sections.familySupport = match[1].trim()
    }
  }

  if (hasMessageToChild) {
    const match = chunk.match(/【四、给孩子的话】([\s\S]*?)(?=【五、|━━|$)/)
    if (match && match[1]) {
      sections.messageToChild = match[1].trim()
    }
  }

  if (hasProfessionalConsultation) {
    const match = chunk.match(/【五、关于专业咨询】([\s\S]*?)(?=━━|$|【)/)
    if (match && match[1]) {
      sections.professionalConsultation = match[1].trim()
    }
  }

  // 如果当前正在生成某个区块，提取该区块的当前内容（包括标题后的所有内容）
  if (currentSection && currentSectionStart >= 0) {
    const afterTitle = chunk.substring(currentSectionStart)
    // 移除标题，只保留内容
    const titlePatterns = {
      overall: /【一、整体理解】/,
      dimensions: /【二、分维度解读】/,
      familySupport: /【三、家庭支持建议】/,
      messageToChild: /【四、给孩子的话】/,
      professionalConsultation: /【五、关于专业咨询】/
    }
    const titlePattern = titlePatterns[currentSection]
    if (titlePattern) {
      const contentAfterTitle = afterTitle.replace(titlePattern, '').trim()
      // 如果还没有遇到下一个区块标题，这部分内容属于当前区块
      const nextSectionPattern = /【[一二三四五]、|━━/
      const nextMatch = contentAfterTitle.match(nextSectionPattern)
      if (nextMatch) {
        // 有下一个区块，只取到下一个区块之前的内容
        const nextPos = contentAfterTitle.indexOf(nextMatch[0])
        sections[currentSection] = contentAfterTitle.substring(0, nextPos).trim()
      } else {
        // 没有下一个区块，全部内容都属于当前区块
        sections[currentSection] = contentAfterTitle.trim()
      }
    }
  }

  return sections
}

