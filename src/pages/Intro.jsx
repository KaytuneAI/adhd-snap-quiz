import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'

function Intro() {
  const navigate = useNavigate()

  const handleStart = () => {
    navigate('/quiz')
  }

  return (
    <div className="page">
      <div className="card">
        <Logo size={140} showText={true} />
        <h1>儿童注意力与行为自评</h1>
        <p>基于 SNAP-IV 量表，为家长设计的在线问卷。</p>
        <p>本测评大约需要 5 分钟时间，请根据孩子在过去 6 个月内的典型表现作答。</p>
        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 12 }}>
          提示：本工具仅用于自我筛查和理解孩子行为特征，不构成医学诊断，也不能替代专业医生的评估。
        </p>
        <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={handleStart}>
          开始测评
        </button>
      </div>
    </div>
  )
}

export default Intro

