import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import snapItems from '../data/snap_iv_26_items.json'
import { computeSnapScores } from '../utils/snapScoring'
import { generateAIAnalysis } from '../utils/deepseekApi'
import Logo from '../components/Logo'
import { getTranslations } from '../utils/translations'

function Result() {
  const navigate = useNavigate()
  const location = useLocation()
  const answers = location.state?.answers
  const lang = location.state?.lang || 'zh'
  const t = getTranslations(lang)

  const [aiAnalysis, setAiAnalysis] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // 使用 ref 来防止重复请求
  const hasRequestedRef = useRef(false)
  const answersKeyRef = useRef(null)
  
  // localStorage key
  const STORAGE_KEY_PREFIX = 'snap_ai_analysis_'

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

  // 使用 useMemo 缓存 scores，避免每次渲染都重新计算
  const scores = useMemo(() => {
    return computeSnapScores(snapItems, answers, lang)
  }, [answers, lang])

  // 生成 answers 的唯一标识（用于判断是否变化）
  const answersKey = useMemo(() => {
    return answers ? JSON.stringify(answers) + lang : null
  }, [answers, lang])

  // 获取AI分析 - 使用 answersKey 来判断是否需要重新请求
  useEffect(() => {
    if (!answers || !answersKey) {
      if (!answers) {
        setIsLoading(false)
      }
      return
    }

    // 先尝试从 localStorage 恢复
    const storageKey = STORAGE_KEY_PREFIX + answersKey
    const savedAnalysis = window.localStorage.getItem(storageKey)
    
    if (savedAnalysis) {
      // 如果本地有保存的分析，直接使用
      setAiAnalysis(savedAnalysis)
      setIsLoading(false)
      setError(null)
      answersKeyRef.current = answersKey
      return
    }

    // 如果 answers 没有变化且已经请求过，不重复请求
    if (answersKeyRef.current === answersKey) {
      return
    }

    // 标记已经请求过这个 answersKey
    answersKeyRef.current = answersKey
    hasRequestedRef.current = true
    let isMounted = true // 防止组件卸载后更新状态

    const fetchAIAnalysis = async () => {
      const requestStartTime = Date.now()
      setIsLoading(true)
      setError(null)
      
      if (import.meta.env.DEV) {
        console.log('🚀 Starting AI analysis request...')
      }
      
      try {
        // 从环境变量获取API密钥，如果没有则使用空字符串（会显示错误）
        const apiKey = import.meta.env.VITE_QWEN_API_KEY || ''
        
        if (!apiKey) {
          throw new Error('API key not configured')
        }

        const analysis = await generateAIAnalysis(snapItems, answers, scores, lang, apiKey)
        
        const requestDuration = Date.now() - requestStartTime
        if (import.meta.env.DEV) {
          console.log(`✅ AI analysis completed in ${requestDuration}ms (${(requestDuration / 1000).toFixed(2)}s)`)
          console.log('📝 Analysis content length:', analysis?.length || 0)
          console.log('📝 Analysis preview:', analysis?.substring(0, 100) || 'empty')
        }
        
        // 只有在组件仍然挂载时才更新状态
        if (isMounted) {
          if (import.meta.env.DEV) {
            console.log('🔄 Updating state - isMounted:', isMounted, 'analysis length:', analysis?.length || 0)
          }
          // 同时更新两个状态，React 18 会自动批处理
          setAiAnalysis(analysis || '')
          setIsLoading(false)
          if (import.meta.env.DEV) {
            console.log('🛑 Loading state set to false, aiAnalysis set to:', (analysis || '').substring(0, 50))
          }
          // 保存到 localStorage
          if (analysis) {
            try {
              window.localStorage.setItem(storageKey, analysis)
            } catch (storageError) {
              console.warn('Failed to save AI analysis to localStorage:', storageError)
            }
          }
        } else {
          if (import.meta.env.DEV) {
            console.warn('⚠️ Component unmounted, skipping state update')
          }
        }
      } catch (err) {
        const requestDuration = Date.now() - requestStartTime
        console.error('❌ Failed to generate AI analysis:', err)
        if (import.meta.env.DEV) {
          console.log(`⏱️ Request failed after ${requestDuration}ms (${(requestDuration / 1000).toFixed(2)}s)`)
        }
        // 只有在组件仍然挂载时才更新状态
        if (isMounted) {
          setError(err.message)
          // 如果API调用失败，使用默认的静态描述
          setAiAnalysis('')
          setIsLoading(false) // 确保停止加载动画
        }
      }
    }

    fetchAIAnalysis()

    // 清理函数：组件卸载时设置标志
    return () => {
      isMounted = false
    }
  }, [answersKey, answers, scores, lang])

  return (
    <div className="page">
      <div className="card result-card">
        <Logo size={70} showText={true} showAdhd={false} />
        <h2 style={{ fontSize: 18, marginBottom: 8, marginTop: 8 }}>{t.result.title}</h2>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
          {t.result.description}
        </p>

        {/* 显示各维度得分 */}
        {Object.entries(scores).map(([domain, detail]) => (
          <div
            key={domain}
            style={{
              marginBottom: 12,
              padding: '10px 12px',
              borderRadius: 12,
              background: '#f9fafb',
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 8 
              }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{domainLabel(domain)}</div>
                <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
                  {t.result.averageScore} {detail.average}
                </div>
              </div>
              {/* 体检评分滑动条 */}
              <div className="score-slider-container">
                <div className="score-slider-track">
                  {/* 分段颜色区域 */}
                  <div className="score-segment score-segment-normal" style={{ width: '25%' }}></div>
                  <div className="score-segment score-segment-mild" style={{ width: '25%', left: '25%' }}></div>
                  <div className="score-segment score-segment-moderate" style={{ width: '25%', left: '50%' }}></div>
                  <div className="score-segment score-segment-strong" style={{ width: '25%', left: '75%' }}></div>
                  
                  {/* 指示器 */}
                  <div 
                    className="score-slider-indicator"
                    style={{
                      left: `${Math.min((detail.average / 3) * 100, 100)}%`,
                      backgroundColor: detail.chipClass === 'chip-normal' ? '#16a34a' :
                                      detail.chipClass === 'chip-mild' ? '#d97706' :
                                      detail.chipClass === 'chip-moderate' ? '#dc2626' : '#991b1b'
                    }}
                  />
                </div>
                <div className="score-slider-labels">
                  <span>0</span>
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* AI分析区域 */}
        <div
          style={{
            marginTop: 20,
            padding: '16px',
            borderRadius: 12,
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
          }}
        >
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#1f2937' }}>
            {lang === 'zh' ? 'AI 专业分析' : 'AI Professional Analysis'}
          </h3>
          
          {isLoading && !aiAnalysis && (
            <div style={{ 
              padding: '30px 20px', 
              textAlign: 'center', 
              color: '#6b7280',
              fontSize: 14 
            }}>
              <div className="ai-loading-animation">
                <div className="magic-circle">
                  <div className="magic-ring magic-ring-1"></div>
                  <div className="magic-ring magic-ring-2"></div>
                  <div className="magic-ring magic-ring-3"></div>
                  <div className="magic-core"></div>
                  <div className="magic-particles">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
                <div className="magic-text" style={{ marginTop: 24 }}>
                  {lang === 'zh' ? '正在生成AI分析...' : 'Generating AI analysis...'}
                </div>
              </div>
            </div>
          )}

          {error && !isLoading && (
            <div style={{ 
              padding: '12px', 
              background: '#fef3c7', 
              borderRadius: 8,
              color: '#92400e',
              fontSize: 13,
              marginBottom: 12
            }}>
              {lang === 'zh' 
                ? 'AI分析暂时不可用，请稍后重试。' 
                : 'AI analysis is temporarily unavailable, please try again later.'}
            </div>
          )}

          {!isLoading && !error && aiAnalysis && (
            <div 
              className="ai-analysis-content"
              style={{ 
                fontSize: 14, 
                color: '#4b5563', 
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                maxHeight: 'none', // 移除高度限制，让内容自然撑开
                overflowY: 'visible',
                overflowX: 'hidden',
                paddingRight: '8px',
                paddingBottom: '8px',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {aiAnalysis}
            </div>
          )}
          
          {/* 调试信息 - 仅在开发环境显示 */}
          {import.meta.env.DEV && (
            <div style={{ 
              marginTop: 12, 
              padding: 8, 
              background: '#f3f4f6', 
              borderRadius: 4, 
              fontSize: 11, 
              color: '#6b7280' 
            }}>
              Debug: isLoading={String(isLoading)}, hasAnalysis={String(!!aiAnalysis)}, analysisLength={aiAnalysis?.length || 0}
            </div>
          )}

          {!isLoading && !error && !aiAnalysis && (
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              {Object.entries(scores).map(([domain, detail]) => (
                <div key={domain} style={{ marginBottom: 8 }}>
                  <strong>{domainLabel(domain)}</strong>: {detail.desc}
                </div>
              ))}
            </div>
          )}
        </div>

        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 16 }}>
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

