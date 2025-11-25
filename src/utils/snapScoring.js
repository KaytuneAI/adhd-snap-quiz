// src/utils/snapScoring.js
import { getTranslations } from './translations'

// 简单的等级划分：基于临床阈值做一个 UI 友好版本
const thresholds = {
  inattention: 1.78,
  hyperactivity_impulsivity: 1.44,
  oppositional: 1.88,
}

function levelFromAverage(domain, avg, lang = 'zh') {
  const t = thresholds[domain] ?? 1.5
  const t_ = getTranslations(lang)
  
  if (avg < t * 0.5) {
    return {
      key: 'normal',
      label: t_.result.levels.normal.label,
      chipClass: 'chip-normal',
      desc: t_.result.levels.normal.desc,
    }
  } else if (avg < t) {
    return {
      key: 'mild',
      label: t_.result.levels.mild.label,
      chipClass: 'chip-mild',
      desc: t_.result.levels.mild.desc,
    }
  } else if (avg < t + 0.5) {
    return {
      key: 'moderate',
      label: t_.result.levels.moderate.label,
      chipClass: 'chip-moderate',
      desc: t_.result.levels.moderate.desc,
    }
  } else {
    return {
      key: 'strong',
      label: t_.result.levels.strong.label,
      chipClass: 'chip-strong',
      desc: t_.result.levels.strong.desc,
    }
  }
}

export function computeSnapScores(items, answers, lang = 'zh') {
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
      ...levelFromAverage(domain, avg, lang),
    }
  })

  return result
}

