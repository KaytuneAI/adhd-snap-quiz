import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import snapItems from '../data/snap_iv_26_items.json'
import { getTranslations } from '../utils/translations'

const QUESTIONS_PER_PAGE = 3
const STORAGE_KEY_ANSWERS = 'snap_answers_v1'
const STORAGE_KEY_PROGRESS = 'snap_progress_v1'

function Quiz() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // 恢复或初始化语言
  const getInitialLang = () => {
    // 优先使用URL传递的语言
    if (location.state?.lang) {
      return location.state.lang
    }
    // 其次使用保存的语言
    const savedProgress = window.localStorage.getItem(STORAGE_KEY_PROGRESS)
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress)
        return parsed.lang || 'zh'
      } catch (e) {
        return 'zh'
      }
    }
    return 'zh'
  }

  const [lang] = useState(getInitialLang)
  const t = getTranslations(lang)
  
  const OPTIONS = t.options.map(opt => ({
    ...opt,
    color: opt.value === 0 ? '#aad2d1' : opt.value === 1 ? '#c5e3e2' : opt.value === 2 ? '#f5b8be' : '#e88a94',
    borderColor: opt.value === 0 ? '#7fb8b7' : opt.value === 1 ? '#9dd0cf' : opt.value === 2 ? '#f0a0a8' : '#d66b7a'
  }))

  // 恢复本地进度（包括答案、页面和语言）
  // 注意：需要在lang初始化之后才能正确检查语言匹配
  const getInitialPage = () => {
    const savedProgress = window.localStorage.getItem(STORAGE_KEY_PROGRESS)
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress)
        // 获取当前使用的语言（优先URL，其次保存的）
        const currentLang = location.state?.lang || parsed.lang || 'zh'
        // 如果保存的语言和当前语言一致，恢复页面；否则从第一页开始
        if (parsed.lang === currentLang && typeof parsed.currentPage === 'number') {
          return parsed.currentPage
        }
      } catch (e) {
        console.warn('Failed to parse saved progress')
      }
    }
    return 0
  }

  const [currentPage, setCurrentPage] = useState(getInitialPage)

  const [answers, setAnswers] = useState(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY_ANSWERS)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length === snapItems.length) {
          return parsed
        }
      } catch (e) {
        console.warn('Failed to parse saved answers')
      }
    }
    return Array(snapItems.length).fill(null)
  })


  const [showHint, setShowHint] = useState(false)

  // 保存答案到localStorage
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY_ANSWERS, JSON.stringify(answers))
  }, [answers])

  // 保存进度（页面和语言）到localStorage
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify({
      currentPage,
      lang,
      lastUpdated: Date.now()
    }))
  }, [currentPage, lang])

  const totalPages = Math.ceil(snapItems.length / QUESTIONS_PER_PAGE)
  const startIndex = currentPage * QUESTIONS_PER_PAGE
  const endIndex = Math.min(startIndex + QUESTIONS_PER_PAGE, snapItems.length)
  const currentQuestions = snapItems.slice(startIndex, endIndex)
  const progress = ((endIndex) / snapItems.length) * 100

  const handleSelect = (questionIndex, value) => {
    const next = [...answers]
    next[startIndex + questionIndex] = value
    setAnswers(next)
  }

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // 全部答完，清除保存的进度，跳转结果页
      window.localStorage.removeItem(STORAGE_KEY_PROGRESS)
      window.localStorage.removeItem(STORAGE_KEY_ANSWERS)
      navigate('/result', { state: { answers, lang } })
    }
  }

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const currentPageAnswers = currentQuestions.map((_, idx) => answers[startIndex + idx])
  const allCurrentPageAnswered = currentPageAnswers.every((a) => a !== null)
  const allAnswered = answers.every((a) => a !== null)

  return (
    <div className="page">
      <div className="card">
        <div className="card-header">
          <div className="progress-wrapper">
            <div className="progress-header">
              <span className="progress-percent">{Math.round(progress)}%</span>
              <div className="progress-bar">
                <div className="progress-inner" style={{ width: `${progress}%` }} />
              </div>
              <span className="progress-step">{t.quiz.step} {currentPage + 1} of {totalPages}</span>
            </div>
          </div>

          <h2 className="quiz-title">{t.quiz.title}</h2>

          <div className="options-legend">
            {OPTIONS.map((opt) => (
              <div key={opt.value} className="legend-item">
                <div className="legend-balloon" style={{ backgroundColor: opt.color }}></div>
                <span className="legend-label">{opt.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-body">
          <div className="questions-container">
            {currentQuestions.map((question, questionIndex) => {
              const globalIndex = startIndex + questionIndex
              return (
                <div key={question.id} className="question-card">
                  <div className="question-text">
                    <span className="question-number">{globalIndex + 1}.</span>
                    {lang === 'zh' ? question.text_cn : question.text_en}
                  </div>
                  <div className="balloon-options">
                    {OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`balloon ${answers[globalIndex] === opt.value ? 'selected' : ''}`}
                        style={{ 
                          backgroundColor: opt.color,
                          ...(answers[globalIndex] === opt.value && { borderColor: opt.borderColor })
                        }}
                        onClick={() => handleSelect(questionIndex, opt.value)}
                        aria-label={opt.label}
                        title={opt.label}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card-footer">
          <div className="footer-nav">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePrev}
              disabled={currentPage === 0}
              style={{
                opacity: currentPage === 0 ? 0.5 : 1,
                cursor: currentPage === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {t.quiz.prevButton}
            </button>
            <div style={{ position: 'relative', flex: 1 }}>
              {showHint && (
                <div className="hint-bubble">
                  {t.quiz.hint}
                </div>
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (!allCurrentPageAnswered) {
                    setShowHint(true)
                    setTimeout(() => setShowHint(false), 3000)
                    return
                  }
                  handleNext()
                }}
                style={{ 
                  opacity: !allCurrentPageAnswered ? 0.6 : 1,
                  cursor: !allCurrentPageAnswered ? 'not-allowed' : 'pointer',
                  width: '100%'
                }}
              >
                {currentPage === totalPages - 1 ? t.quiz.viewResult : t.quiz.nextButton}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Quiz

