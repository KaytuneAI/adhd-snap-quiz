import { useLocation, useNavigate } from 'react-router-dom'
import snapItems from '../data/snap_iv_26_items.json'
import { computeSnapScores } from '../utils/snapScoring'
import Logo from '../components/Logo'

function domainLabel(domain) {
  switch (domain) {
    case 'inattention':
      return '注意力相关特征'
    case 'hyperactivity_impulsivity':
      return '多动 / 冲动相关特征'
    case 'oppositional':
      return '对立违抗相关特征'
    default:
      return domain
  }
}

function Result() {
  const navigate = useNavigate()
  const location = useLocation()
  const answers = location.state?.answers

  if (!answers) {
    // 若用户直接访问 /result，没有答案，就跳回首页
    return (
      <div className="page">
        <div className="card">
          <h2>暂无测评结果</h2>
          <p>请先完成一次问卷测评，再查看结果。</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            返回首页
          </button>
        </div>
      </div>
    )
  }

  const scores = computeSnapScores(snapItems, answers)

  return (
    <div className="page">
      <div className="card">
        <Logo size={100} showText={true} />
        <h2>测评结果概览</h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
          以下结果基于 SNAP-IV 量表，仅用于了解孩子在不同维度的行为特征，不构成医学诊断。
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
                {detail.label}（均分 {detail.average}）
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#4b5563' }}>{detail.desc}</div>
          </div>
        ))}

        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
          如您对结果存有疑虑，或孩子在学习、人际和情绪方面已有明显困扰，建议尽快咨询儿科、精神科或儿童心理专业人士。
        </p>

        <button
          className="btn btn-secondary"
          style={{ marginTop: 16 }}
          onClick={() => navigate('/')}
        >
          返回首页
        </button>
      </div>
    </div>
  )
}

export default Result

