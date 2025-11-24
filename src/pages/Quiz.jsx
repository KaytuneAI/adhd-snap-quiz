import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import snapItems from '../data/snap_iv_26_items.json'

const OPTIONS = [
  { value: 0, label: '从不 / 很少', color: '#bbf7d0', borderColor: '#16a34a' }, // 柔和的浅绿色 + 深绿色边框
  { value: 1, label: '偶尔', color: '#86efac', borderColor: '#059669' }, // 稍深一点的绿色 + 深绿色边框
  { value: 2, label: '经常', color: '#fecaca', borderColor: '#ef4444' }, // 更浅的红色 + 深红色边框
  { value: 3, label: '非常经常', color: '#fca5a5', borderColor: '#dc2626' }, // 柔和的浅红色 + 深红色边框
]

const QUESTIONS_PER_PAGE = 3
const STORAGE_KEY = 'snap_answers_v1'

function Quiz() {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(0)
  const [answers, setAnswers] = useState(Array(snapItems.length).fill(null))

  // 恢复本地进度
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length === snapItems.length) {
          setAnswers(parsed)
        }
      } catch (e) {
        console.warn('Failed to parse saved answers')
      }
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers))
  }, [answers])

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
      // 全部答完，跳转结果页
      navigate('/result', { state: { answers } })
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
              <span className="progress-step">Step {currentPage + 1} of {totalPages}</span>
            </div>
          </div>

          <h2 className="quiz-title">请选择每项描述与孩子的符合程度</h2>

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
                    {question.text_cn}
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
          {!allCurrentPageAnswered && (
            <p className="answer-required-hint">
              所有问题必须回答后才能继续。
            </p>
          )}

          <div className="footer-nav">
            {currentPage > 0 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handlePrev}
              >
                上一页
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNext}
              disabled={!allCurrentPageAnswered}
              style={{ 
                opacity: !allCurrentPageAnswered ? 0.6 : 1,
                cursor: !allCurrentPageAnswered ? 'not-allowed' : 'pointer',
                width: currentPage === 0 ? '100%' : 'auto',
                flex: currentPage === 0 ? 1 : 'none'
              }}
            >
              {currentPage === totalPages - 1 ? '查看结果' : '下一页'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Quiz

