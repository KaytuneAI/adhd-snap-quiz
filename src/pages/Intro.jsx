import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { getTranslations } from '../utils/translations'

function Intro() {
  const navigate = useNavigate()
  const [lang, setLang] = useState('zh')
  const t = getTranslations(lang)

  const handleStart = () => {
    navigate('/quiz', { state: { lang } })
  }

  const handleLangToggle = () => {
    setLang(lang === 'zh' ? 'en' : 'zh')
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
          <button 
            className="btn btn-start" 
            onClick={handleStart}
          >
            {t.intro.startButton}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Intro

