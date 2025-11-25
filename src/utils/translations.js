// src/utils/translations.js

export const translations = {
  zh: {
    intro: {
      title: '儿童注意力与行为自评',
      subtitle: '基于 SNAP-IV 量表，为家长设计的在线问卷。',
      description: '本测评大约需要 5 分钟时间，请根据孩子在过去 6 个月内的典型表现作答。',
      disclaimer: '提示：本工具仅用于自我筛查和理解孩子行为特征，不构成医学诊断，也不能替代专业医生的评估。',
      startButton: '开始测评',
      selectLanguage: '请选择语言 / Please select language',
      changeLanguage: '切换到 English'
    },
    quiz: {
      title: '请选择每项描述与孩子的符合程度',
      prevButton: '上一页',
      nextButton: '下一页',
      viewResult: '查看结果',
      hint: '所有问题必须回答后才能继续。',
      step: 'Step'
    },
    result: {
      title: 'SNAP-IV ADHD评测结果',
      description: '以下结果基于 SNAP-IV 量表，仅用于了解孩子在不同维度的行为特征，不构成医学诊断。',
      backButton: '返回首页',
      noResult: '暂无测评结果',
      noResultDesc: '请先完成一次问卷测评，再查看结果。',
      disclaimer: '如您对结果存有疑虑，或孩子在学习、人际和情绪方面已有明显困扰，建议尽快咨询儿科、精神科或儿童心理专业人士。',
      domains: {
        inattention: '注意力相关特征',
        hyperactivity_impulsivity: '多动 / 冲动相关特征',
        oppositional: '对立违抗相关特征'
      },
      levels: {
        normal: {
          label: '正常范围',
          desc: '当前量表结果总体在正常范围内，可继续日常观察。'
        },
        mild: {
          label: '轻微的 ADHD 相关特征',
          desc: '在该维度上呈现出轻微的注意力或行为特征，建议在学习与生活中给予适当支持。'
        },
        moderate: {
          label: '中度的 ADHD 相关特征',
          desc: '该维度得分较高，建议结合日常表现，必要时可咨询专业医生或心理专家。'
        },
        strong: {
          label: '显著的 ADHD 相关特征',
          desc: '该维度特征较为明显，建议尽快寻求专业机构的进一步评估与支持。'
        }
      },
      averageScore: '均分'
    },
    options: [
      { value: 0, label: '从不 / 很少' },
      { value: 1, label: '偶尔' },
      { value: 2, label: '经常' },
      { value: 3, label: '非常经常' }
    ]
  },
  en: {
    intro: {
      title: 'Child Attention and Behavior Self-Assessment',
      subtitle: 'An online questionnaire for parents based on the SNAP-IV scale.',
      description: 'This assessment takes approximately 5 minutes. Please answer based on your child\'s typical behavior over the past 6 months.',
      disclaimer: 'Note: This tool is for self-screening and understanding your child\'s behavioral characteristics only. It does not constitute a medical diagnosis and cannot replace professional medical evaluation.',
      startButton: 'Start Assessment',
      selectLanguage: 'Please select language / 请选择语言',
      changeLanguage: '切换到 中文'
    },
    quiz: {
      title: 'Please select how well each statement describes your child',
      prevButton: 'Previous',
      nextButton: 'Next',
      viewResult: 'View Results',
      hint: 'All questions must be answered before continuing.',
      step: 'Step'
    },
    result: {
      title: 'SNAP-IV ADHD Assessment Results',
      description: 'The following results are based on the SNAP-IV scale and are for understanding your child\'s behavioral characteristics across different dimensions only. This does not constitute a medical diagnosis.',
      backButton: 'Back to Home',
      noResult: 'No Assessment Results',
      noResultDesc: 'Please complete a questionnaire assessment first, then view the results.',
      disclaimer: 'If you have concerns about the results, or if your child is experiencing significant difficulties in learning, relationships, or emotions, please consult a pediatrician, psychiatrist, or child psychology professional as soon as possible.',
      domains: {
        inattention: 'Inattention-Related Characteristics',
        hyperactivity_impulsivity: 'Hyperactivity / Impulsivity-Related Characteristics',
        oppositional: 'Oppositional Defiant Characteristics'
      },
      levels: {
        normal: {
          label: 'Normal Range',
          desc: 'The current scale results are generally within the normal range. Continue with daily observation.'
        },
        mild: {
          label: 'Mild ADHD-Related Characteristics',
          desc: 'Shows mild attention or behavioral characteristics in this dimension. Consider providing appropriate support in learning and daily life.'
        },
        moderate: {
          label: 'Moderate ADHD-Related Characteristics',
          desc: 'Higher scores in this dimension. Consider consulting with a professional doctor or psychologist if necessary, based on daily performance.'
        },
        strong: {
          label: 'Significant ADHD-Related Characteristics',
          desc: 'Characteristics in this dimension are more pronounced. Consider seeking further assessment and support from professional institutions as soon as possible.'
        }
      },
      averageScore: 'Average'
    },
    options: [
      { value: 0, label: 'Not at all / Rarely' },
      { value: 1, label: 'Sometimes' },
      { value: 2, label: 'Often' },
      { value: 3, label: 'Very Often' }
    ]
  }
}

export function getTranslations(lang) {
  return translations[lang] || translations.zh
}

