import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { getTranslations } from '../utils/translations'
import snapItems from '../data/snap_iv_26_items.json'

const STORAGE_KEY_ANSWERS = 'snap_answers_v1'
const STORAGE_KEY_PROGRESS = 'snap_progress_v1'

function Intro() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(() => {
    // 检查是否有保存的进度，如果有，使用保存的语言
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
  })
  const [hasUnfinishedQuiz, setHasUnfinishedQuiz] = useState(false)
  const t = getTranslations(lang)

  // 检查是否有未完成的答题
  useEffect(() => {
    const savedAnswers = window.localStorage.getItem(STORAGE_KEY_ANSWERS)
    const savedProgress = window.localStorage.getItem(STORAGE_KEY_PROGRESS)
    
    if (savedAnswers && savedProgress) {
      try {
        const answers = JSON.parse(savedAnswers)
        const progress = JSON.parse(savedProgress)
        
        // 检查是否有未完成的答案（不是全部答完）
        const hasUnanswered = answers.some(a => a === null)
        const isSameLang = progress.lang === lang
        
        // 只有当有未完成的答案且语言匹配时才显示"继续答题"
        setHasUnfinishedQuiz(hasUnanswered && isSameLang)
      } catch (e) {
        // 解析失败，设置为false
        setHasUnfinishedQuiz(false)
      }
    } else {
      // 没有保存的数据，设置为false
      setHasUnfinishedQuiz(false)
    }
  }, [lang])

  const handleStart = () => {
    // 清除之前的进度（如果用户选择重新开始）
    window.localStorage.removeItem(STORAGE_KEY_ANSWERS)
    window.localStorage.removeItem(STORAGE_KEY_PROGRESS)
    navigate('/quiz', { state: { lang } })
  }

  const handleContinue = () => {
    // 继续之前的答题，恢复进度
    navigate('/quiz', { state: { lang } })
  }

  const handleLangToggle = () => {
    const newLang = lang === 'zh' ? 'en' : 'zh'
    setLang(newLang)
    // 切换语言时，如果有未完成的答题，检查新语言是否匹配
    const savedProgress = window.localStorage.getItem(STORAGE_KEY_PROGRESS)
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress)
        if (parsed.lang !== newLang) {
          setHasUnfinishedQuiz(false)
        }
      } catch (e) {
        // 忽略
      }
    }
  }

  return (
    <div className="page">
      <div className="card intro-card">
        {/* 语言切换文字 - 在卡片内右上角 */}
        <span
          className="lang-toggle-text"
          onClick={handleLangToggle}
        >
          {lang === 'zh' ? 'Eng' : '中文'}
        </span>

        {/* Logo 区域 - 占 40% */}
        <div className="intro-logo-section">
          <Logo size={150} showText={true} />
        </div>

        {/* 内容区域 - 占 40% */}
        <div className="intro-content-section">
          <h1 style={{ fontSize: 20, marginBottom: 12 }}>{t.intro.title}</h1>
          <p style={{ fontSize: 14, marginBottom: 8 }}>{t.intro.subtitle}</p>
          <p style={{ fontSize: 14, marginBottom: 8 }}>{t.intro.description}</p>
          <p style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.4 }}>
            {t.intro.disclaimer}
          </p>
        </div>

        {/* 按钮区域 - 占剩余空间（约 20%） */}
        <div className="intro-button-section">
          {hasUnfinishedQuiz && (
            <button 
              className="btn btn-start" 
              onClick={handleContinue}
              style={{ 
                marginBottom: 12,
                backgroundColor: '#6ba8a6',
                borderColor: '#6ba8a6'
              }}
            >
              {lang === 'zh' ? '继续答题' : 'Continue Quiz'}
            </button>
          )}
          <button 
            className="btn btn-start" 
            onClick={handleStart}
            style={hasUnfinishedQuiz ? {
              backgroundColor: '#6b7280',
              borderColor: '#6b7280'
            } : {}}
          >
            {hasUnfinishedQuiz 
              ? (lang === 'zh' ? '重新开始' : 'Start Over')
              : t.intro.startButton}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Intro

