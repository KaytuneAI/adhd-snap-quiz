// src/utils/snapScoring.js

// 简单的等级划分：基于临床阈值做一个 UI 友好版本
const thresholds = {
  inattention: 1.78,
  hyperactivity_impulsivity: 1.44,
  oppositional: 1.88,
}

function levelFromAverage(domain, avg) {
  const t = thresholds[domain] ?? 1.5
  if (avg < t * 0.5) {
    return {
      key: 'normal',
      label: '正常范围',
      chipClass: 'chip-normal',
      desc: '当前量表结果总体在正常范围内，可继续日常观察。',
    }
  } else if (avg < t) {
    return {
      key: 'mild',
      label: '轻微的 ADHD 相关特征',
      chipClass: 'chip-mild',
      desc: '在该维度上呈现出轻微的注意力或行为特征，建议在学习与生活中给予适当支持。',
    }
  } else if (avg < t + 0.5) {
    return {
      key: 'moderate',
      label: '中度的 ADHD 相关特征',
      chipClass: 'chip-moderate',
      desc: '该维度得分较高，建议结合日常表现，必要时可咨询专业医生或心理专家。',
    }
  } else {
    return {
      key: 'strong',
      label: '显著的 ADHD 相关特征',
      chipClass: 'chip-strong',
      desc: '该维度特征较为明显，建议尽快寻求专业机构的进一步评估与支持。',
    }
  }
}

export function computeSnapScores(items, answers) {
  const domains = {}

  items.forEach((item, idx) => {
    const domain = item.domain || 'other'
    const score = answers[idx] ?? 0
    if (!domains[domain]) {
      domains[domain] = { sum: 0, count: 0 }
    }
    domains[domain].sum += score
    domains[domain].count += 1
  })

  const result = {}

  Object.entries(domains).forEach(([domain, { sum, count }]) => {
    const avg = count > 0 ? sum / count : 0
    result[domain] = {
      average: Number(avg.toFixed(2)),
      ...levelFromAverage(domain, avg),
    }
  })

  return result
}

