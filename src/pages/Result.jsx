import { useLocation, useNavigate } from 'react-router-dom'
import snapItems from '../data/snap_iv_26_items.json'
import { computeSnapScores } from '../utils/snapScoring'
import Logo from '../components/Logo'
import { getTranslations } from '../utils/translations'

function Result() {
  const navigate = useNavigate()
  const location = useLocation()
  const answers = location.state?.answers
  const lang = location.state?.lang || 'zh'
  const t = getTranslations(lang)

  function domainLabel(domain) {
    return t.result.domains[domain] || domain
  }

  if (!answers) {
    // 若用户直接访问 /result，没有答案，就跳回首页
    return (
      <div className="page">
        <div className="card">
          <h2>{t.result.noResult}</h2>
          <p>{t.result.noResultDesc}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            {t.result.backButton}
          </button>
        </div>
      </div>
    )
  }

  const scores = computeSnapScores(snapItems, answers, lang)

  return (
    <div className="page">
      <div className="card result-card">
        <Logo size={70} showText={true} showAdhd={false} />
        <h2 style={{ fontSize: 18, marginBottom: 8, marginTop: 8 }}>{t.result.title}</h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
          {t.result.description}
        </p>

        {Object.entries(scores).map(([domain, detail]) => (
          <div
            key={domain}
            style={{
              marginBottom: 16,
              padding: '10px 12px',
              borderRadius: 12,
              background: '#f9fafb',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <div style={{ fontWeight: 600 }}>{domainLabel(domain)}</div>
              <div className={`result-chip ${detail.chipClass}`}>
                {detail.label} ({t.result.averageScore} {detail.average})
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#4b5563' }}>{detail.desc}</div>
          </div>
        ))}

        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
          {t.result.disclaimer}
        </p>

        <button
          className="btn btn-secondary"
          style={{ marginTop: 16 }}
          onClick={() => navigate('/')}
        >
          {t.result.backButton}
        </button>
      </div>
    </div>
  )
}

export default Result

