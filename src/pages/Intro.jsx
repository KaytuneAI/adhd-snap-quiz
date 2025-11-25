import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { getTranslations } from '../utils/translations'

function Intro() {
  const navigate = useNavigate()
  const [selectedLang, setSelectedLang] = useState(null)
  const [t, setT] = useState(getTranslations('zh'))

  const handleLangSelect = (lang) => {
    setSelectedLang(lang)
    setT(getTranslations(lang))
  }

  const handleStart = () => {
    if (selectedLang) {
      navigate('/quiz', { state: { lang: selectedLang } })
    }
  }

  return (
    <div className="page">
      <div className="card intro-card">
        <Logo size={100} showText={true} />
        <h1 style={{ fontSize: 20, marginBottom: 12 }}>{t.intro.title}</h1>
        <p style={{ fontSize: 14, marginBottom: 8 }}>{t.intro.subtitle}</p>
        <p style={{ fontSize: 14, marginBottom: 12 }}>{t.intro.description}</p>
        
        {!selectedLang && (
          <div style={{ marginTop: 20, marginBottom: 16 }}>
            <p style={{ fontSize: 14, marginBottom: 12, fontWeight: 600, textAlign: 'center' }}>
              {t.intro.selectLanguage}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn btn-secondary"
                onClick={() => handleLangSelect('zh')}
                style={{ flex: 1 }}
              >
                中文
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleLangSelect('en')}
                style={{ flex: 1 }}
              >
                English
              </button>
            </div>
          </div>
        )}

        {selectedLang && (
          <>
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 12, lineHeight: 1.4 }}>
              {t.intro.disclaimer}
            </p>
            <button 
              className="btn btn-primary" 
              style={{ marginTop: 20, marginBottom: 8 }} 
              onClick={handleStart}
            >
              {t.intro.startButton}
            </button>
            <button
              className="btn btn-secondary"
              style={{ marginTop: 8 }}
              onClick={() => {
                setSelectedLang(null)
                setT(getTranslations('zh'))
              }}
            >
              {t.intro.changeLanguage}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default Intro

