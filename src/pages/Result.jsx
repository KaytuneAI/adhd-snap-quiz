import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import snapItems from '../data/snap_iv_26_items.json'
import { computeSnapScores } from '../utils/snapScoring'
import { generateAIAnalysis, testAIConnection } from '../utils/deepseekApi'
import { generatePDFViaAPI } from '../utils/pdfApi'
import { generateReportContent, parseAIAnalysis, parseStreamingContent } from '../utils/reportContent'
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
  const [showCredits, setShowCredits] = useState(false)
  
  // 流式输出时，按区块分别存储内容
  const [streamingContent, setStreamingContent] = useState({
    overall: '',
    dimensions: '',
    familySupport: '',
    messageToChild: '',
    professionalConsultation: ''
  })
  
  // 调试：监听状态变化
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔍 State changed - isLoading:', isLoading, 'aiAnalysis length:', aiAnalysis?.length || 0, 'error:', error)
    }
  }, [isLoading, aiAnalysis, error])
  
  // 使用 ref 来防止重复请求
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

  // 生成报告内容
  const reportContent = useMemo(() => {
    return generateReportContent(lang, scores, domainLabel)
  }, [lang, scores, domainLabel])

  // 解析AI分析（流式输出时使用 streamingContent，完成后使用 aiAnalysis）
  const parsedAI = useMemo(() => {
    if (isLoading && Object.values(streamingContent).some(v => v)) {
      // 流式输出中，使用实时解析的内容
      return streamingContent
    }
    // 完成后，使用完整内容解析
    return parseAIAnalysis(aiAnalysis || '')
  }, [aiAnalysis, streamingContent, isLoading])

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
      answersKeyRef.current = answersKey // 缓存命中时标记为已处理
      return
    }

    // 如果 answers 没有变化且已经请求过，不重复请求
    if (answersKeyRef.current === answersKey) {
      return
    }

    // ✅ 关键修改：不在请求开始时就标记，而是在成功写入 state 后才标记
    // 使用局部 cancelled flag 代替全局 requestId
    let cancelled = false

    const fetchAIAnalysis = async () => {
      const requestStartTime = Date.now()
      setIsLoading(true)
      setError(null)
      // 重置流式内容
      setStreamingContent({
        overall: '',
        dimensions: '',
        familySupport: '',
        messageToChild: '',
        professionalConsultation: ''
      })
      
      if (import.meta.env.DEV) {
        console.log('🚀 Starting AI analysis request...')
      }
      
      try {
        // 从环境变量获取API密钥（支持 DeepSeek 和 Qwen）
        const aiProvider = import.meta.env.VITE_AI_PROVIDER || 'qwen'
        const apiKey = aiProvider === 'deepseek' 
          ? (import.meta.env.VITE_DEEPSEEK_API_KEY || '')
          : (import.meta.env.VITE_QWEN_API_KEY || '')
        
        if (!apiKey) {
          const keyName = aiProvider === 'deepseek' ? 'VITE_DEEPSEEK_API_KEY' : 'VITE_QWEN_API_KEY'
          throw new Error(`API key not configured. Please set ${keyName} in .env file`)
        }
        
        if (import.meta.env.DEV) {
          console.log(`🔑 Using ${aiProvider === 'deepseek' ? 'DeepSeek' : 'Qwen'} API`)
          console.log(`🔑 API Key length: ${apiKey.length} (starts with: ${apiKey.substring(0, 8)}...)`)
        }

        // 流式输出：使用回调函数实时更新内容
        const analysis = await generateAIAnalysis(
          snapItems, 
          answers, 
          scores, 
          lang, 
          apiKey,
          (chunk) => {
            // 实时解析区块，让内容直接显示到对应区块
            if (!cancelled) {
              // 保存完整内容（用于最终解析）
              setAiAnalysis(chunk)
              // 实时解析并更新各个区块
              const parsed = parseStreamingContent(chunk)
              setStreamingContent(parsed)
            }
          }
        )
        
        // ✅ 关键：在请求返回后立即检查是否已取消
        if (cancelled) {
          if (import.meta.env.DEV) {
            console.log('⚠️ Request cancelled, skipping state update')
          }
          return
        }
        
        const requestDuration = Date.now() - requestStartTime
        if (import.meta.env.DEV) {
          console.log(`✅ AI analysis completed in ${requestDuration}ms (${(requestDuration / 1000).toFixed(2)}s)`)
          console.log('📝 Analysis content length:', analysis?.length || 0)
          console.log('📝 Analysis preview:', analysis?.substring(0, 100) || 'empty')
        }
        
        // 确保最终内容已设置（流式输出时可能已经设置，但这里作为保险）
        if (analysis && analysis.length > 0) {
          setAiAnalysis(analysis)
          // 最终解析一次，确保所有区块都正确解析
          const finalParsed = parseAIAnalysis(analysis)
          setStreamingContent(finalParsed)
          if (import.meta.env.DEV) {
            console.log('✅ aiAnalysis set, length:', analysis.length)
          }
        } else {
          setAiAnalysis('')
          setStreamingContent({
            overall: '',
            dimensions: '',
            familySupport: '',
            messageToChild: '',
            professionalConsultation: ''
          })
          if (import.meta.env.DEV) {
            console.warn('⚠️ Empty analysis received')
          }
        }
        
        // 然后停止加载
        setIsLoading(false)
        if (import.meta.env.DEV) {
          console.log('🛑 isLoading set to false')
        }
        
        // ✅ 关键：只有在成功写入 state 后才标记为已处理
        answersKeyRef.current = answersKey
        
        // 保存到 localStorage
        if (analysis) {
          try {
            window.localStorage.setItem(storageKey, analysis)
            if (import.meta.env.DEV) {
              console.log('💾 Saved to localStorage')
            }
          } catch (storageError) {
            if (import.meta.env.DEV) {
              console.warn('Failed to save AI analysis to localStorage:', storageError)
            }
          }
        }
      } catch (err) {
        // ✅ 检查是否已取消
        if (cancelled) {
          if (import.meta.env.DEV) {
            console.log('⚠️ Request cancelled during error handling')
          }
          return
        }
        
        const requestDuration = Date.now() - requestStartTime
        if (import.meta.env.DEV) {
          console.error('❌ Failed to generate AI analysis:', err)
          console.log(`⏱️ Request failed after ${requestDuration}ms (${(requestDuration / 1000).toFixed(2)}s)`)
        }
        setError(err.message)
        // 如果API调用失败，使用默认的静态描述
        setAiAnalysis('')
        setIsLoading(false) // 确保停止加载动画
      }
    }

    fetchAIAnalysis()

    // ✅ 清理函数：只设置局部 cancelled flag
    return () => {
      cancelled = true
      if (import.meta.env.DEV) {
        console.log('🧹 Cleanup: Request cancelled')
      }
    }
  }, [answersKey, answers, scores, lang])

  // 渲染模块的辅助函数
  const renderSection = (title, content, children = null) => (
    <div
      style={{
        marginBottom: 24,
        padding: '20px',
        borderRadius: 12,
        background: '#ffffff',
        border: '1px solid #e5e7eb',
      }}
    >
      <h3 style={{ 
        fontSize: 16, 
        fontWeight: 600, 
        marginBottom: 12, 
        color: '#1f2937',
        borderBottom: '2px solid #f3f4f6',
        paddingBottom: 8
      }}>
        {title}
      </h3>
      {content && (
        <div style={{ 
          fontSize: 14, 
          color: '#4b5563', 
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap'
        }}>
          {content}
        </div>
      )}
      {children}
    </div>
  )

  return (
    <div className="page">
      <div className="card result-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* 🟦 封面 */}
        <div style={{ textAlign: 'center', marginBottom: 16, paddingBottom: 12 }}>
        <Logo size={70} showText={true} showAdhd={false} />
          <h1 style={{ fontSize: 20, fontWeight: 600, marginTop: 16, marginBottom: 8, color: '#1f2937' }}>
            {reportContent.cover.title}
          </h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
            {reportContent.cover.subtitle}
          </p>
          <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 24 }}>
            {reportContent.cover.date}
          </p>

          {/* 🟦 01 使用说明 & 安心声明（放在封面页下半部，小字体紧凑版） */}
          <div style={{ 
            textAlign: 'left', 
            marginTop: 16,
            padding: '12px 16px',
            background: '#ffffff',
            borderRadius: 8,
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ 
              fontSize: 12, 
              fontWeight: 600, 
              marginBottom: 8, 
              color: '#1f2937',
              borderBottom: '1px solid #f3f4f6',
              paddingBottom: 6
            }}>
              {reportContent.disclaimer.title}
            </h3>
            <ul style={{ margin: '8px 0', paddingLeft: 18, color: '#4b5563', lineHeight: 1.6, fontSize: 11 }}>
              {reportContent.disclaimer.points.map((point, idx) => (
                <li key={idx} style={{ marginBottom: 4 }}>{point}</li>
              ))}
            </ul>
            {reportContent.disclaimer.keyStatement && (
              <div style={{
                marginTop: 10,
                padding: '8px 12px',
                background: '#f0fdfc',
                borderRadius: 6,
                borderLeft: '3px solid #6ba8a6',
                fontSize: 11,
                color: '#4a7c7a',
                fontWeight: 500,
                lineHeight: 1.5
              }}>
                {reportContent.disclaimer.keyStatement}
              </div>
            )}
          </div>
        </div>

        {/* 🟦 02 本次评估结果概览 和 AI 综合理解（并在一起） */}
        <div style={{ marginBottom: 24 }}>
          {/* 本次评估结果概览 */}
          {renderSection(
            reportContent.overview.title,
            reportContent.overview.intro,
            <div style={{ marginTop: 16 }}>
              {Object.entries(scores).map(([domain, detail], idx) => {
                const dim = reportContent.overview.dimensions.find(d => d.name === domainLabel(domain)) || reportContent.overview.dimensions[idx]
                return (
          <div
            key={domain}
            style={{
                      marginBottom: 16,
                      padding: '12px',
                      borderRadius: 8,
              background: '#f9fafb',
            }}
          >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 8 
              }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#1f2937' }}>{domainLabel(domain)}</div>
                <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
                        {t.result.averageScore} {detail.average} - {detail.label}
                </div>
              </div>
                    {/* 评分滑动条 */}
              <div className="score-slider-container">
                <div className="score-slider-track">
                  <div className="score-segment score-segment-normal" style={{ width: '25%' }}></div>
                  <div className="score-segment score-segment-mild" style={{ width: '25%', left: '25%' }}></div>
                  <div className="score-segment score-segment-moderate" style={{ width: '25%', left: '50%' }}></div>
                  <div className="score-segment score-segment-strong" style={{ width: '25%', left: '75%' }}></div>
                  <div 
                    className="score-slider-indicator"
                    style={{
                            left: `${Math.min((detail.average / 3) * 100, 100)}%`
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
                    <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8, marginBottom: 0 }}>
                      {detail.desc}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {/* AI 综合理解 */}
        <div
          style={{
              marginTop: 16,
              padding: '20px',
            borderRadius: 12,
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
          }}
        >
            <h3 style={{ 
              fontSize: 16, 
              fontWeight: 600, 
              marginBottom: 8, 
              color: '#1f2937',
              borderBottom: '2px solid #e5e7eb',
              paddingBottom: 8
            }}>
              {reportContent.aiAnalysis.title}
          </h3>
            <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16, fontStyle: 'italic' }}>
              {reportContent.aiAnalysis.note}
            </p>
          
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

            {/* 显示"整体理解"部分（流式输出时实时更新） */}
            {(isLoading || !isLoading) && !error && parsedAI.overall && (
              <div 
                className="ai-analysis-content"
                style={{ 
                  fontSize: 14, 
                  color: '#4b5563', 
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {parsedAI.overall}
              </div>
            )}
            
            {/* 如果没有解析出区块，但有原始内容，显示原始内容（兼容旧格式） */}
            {!isLoading && !error && !parsedAI.overall && aiAnalysis && (
            <div 
              className="ai-analysis-content"
              style={{ 
                fontSize: 14, 
                color: '#4b5563', 
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap'
              }}
            >
              {aiAnalysis}
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
        </div>

        {/* 🟦 03 SNAP-IV分维度理解 */}
        {parsedAI.dimensions && renderSection(
          reportContent.dimensionInterpretation.title,
          parsedAI.dimensions
        )}

        {/* 🟦 04 家庭支持建议 和 给孩子的话（并在一起） */}
        <div style={{ marginBottom: 24 }}>
          {/* 家庭支持建议 */}
          {parsedAI.familySupport && renderSection(
            reportContent.familySupport.title,
            parsedAI.familySupport
          )}

          {/* 给孩子的话 */}
          {parsedAI.messageToChild && (
          <div
            style={{
              marginTop: parsedAI.familySupport ? 16 : 0,
              padding: '20px',
              borderRadius: 12,
              background: '#f0fdfc',
              border: '2px solid #aad2d1',
            }}
          >
            <h3 style={{ 
              fontSize: 16, 
              fontWeight: 600, 
              marginBottom: 12, 
              color: '#4a7c7a',
            }}>
              {lang === 'zh' ? '给孩子的话' : 'A Message for the Child'}
            </h3>
            <div style={{ 
              fontSize: 14, 
              color: '#3d6b69', 
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap'
            }}>
                {parsedAI.messageToChild}
              </div>
            </div>
          )}
        </div>

        {/* 🟦 05 专业说明（小字体） */}
        {renderSection(
          reportContent.professionalNote.title,
          null,
          <div style={{ fontSize: '0.9em' }}>
            <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.7, marginBottom: 16 }}>
              {reportContent.professionalNote.disclaimer}
            </p>
            {parsedAI.professionalConsultation && (
              <div style={{ 
                marginBottom: 16,
                padding: '12px',
                background: '#f0fdfc',
                borderRadius: 8,
                fontSize: 12,
                color: '#4b5563',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap'
              }}>
                {parsedAI.professionalConsultation}
              </div>
            )}
          </div>
        )}

        {/* 🟦 附录：SNAP-IV 是什么？（小字体） */}
        <div
          style={{
            marginBottom: 24,
            padding: '20px',
            borderRadius: 12,
            background: '#fafafa',
            border: '1px solid #e5e7eb',
            fontSize: '0.9em'
          }}
        >
          <h3 style={{ 
            fontSize: 14, 
            fontWeight: 600, 
            marginBottom: 12, 
            color: '#1f2937',
            borderBottom: '2px solid #f3f4f6',
            paddingBottom: 8
          }}>
            {reportContent.aboutSnap.title}
          </h3>
          <div>
            <p style={{ fontSize: 12, color: '#4b5563', lineHeight: 1.7, marginBottom: 12 }}>
              {reportContent.aboutSnap.introduction}
            </p>
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#1f2937', marginBottom: 6 }}>
                {lang === 'zh' ? '它能做什么：' : 'What it can do:'}
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#4b5563', lineHeight: 1.7, fontSize: 11 }}>
                {reportContent.aboutSnap.canDo.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>✓ {item}</li>
                ))}
              </ul>
            </div>
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#1f2937', marginBottom: 6 }}>
                {lang === 'zh' ? '它不能做什么：' : 'What it cannot do:'}
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#4b5563', lineHeight: 1.7, fontSize: 11 }}>
                {reportContent.aboutSnap.cannotDo.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>✗ {item}</li>
                ))}
              </ul>
            </div>
            <p style={{ fontSize: 10, color: '#6b7280', fontStyle: 'italic', marginTop: 12 }}>
              {reportContent.aboutSnap.professionalNote}
            </p>
          </div>
        </div>

        {/* 🟦 参考文献（放在最后） */}
        {renderSection(
          lang === 'zh' ? '参考文献' : 'References',
          null,
          <div style={{ fontSize: '0.9em' }}>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#6b7280', fontSize: 11, lineHeight: 1.8 }}>
              {reportContent.professionalNote.references.map((ref, idx) => (
                <li key={idx} style={{ marginBottom: 6 }}>{ref}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 操作按钮 */}
        <div style={{ 
          display: 'flex', 
          gap: 12, 
          marginTop: 32,
          flexDirection: 'column',
          paddingTop: 24,
          borderTop: '2px solid #f3f4f6'
        }}>
          {!isLoading && aiAnalysis && (
            <button
              className="btn btn-primary"
              onClick={async () => {
                try {
                  await generatePDFViaAPI({
                    scores,
                    aiAnalysis,
                    lang,
                    domainLabel,
                    translations: t
                  })
                } catch (error) {
                  if (import.meta.env.DEV) {
                    console.error('Failed to export PDF:', error)
                  }
                  alert(lang === 'zh' 
                    ? '导出PDF失败，请检查控制台错误信息' 
                    : 'Failed to export PDF, please check console for errors')
                }
              }}
            >
              {lang === 'zh' ? '保存为 PDF' : 'Save as PDF'}
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/')}
          >
            {t.result.backButton}
          </button>
        </div>

        {/* Credits 链接 */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: 24, 
          paddingTop: 16,
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={() => setShowCredits(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              fontSize: 12,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0
            }}
          >
            Credits
          </button>
        </div>
      </div>

      {/* Credits 模态框 */}
      {showCredits && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowCredits(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ 
              fontSize: 20, 
              fontWeight: 600, 
              marginBottom: 20, 
              color: '#1f2937' 
            }}>
              Credits
            </h2>
            <div style={{ 
              fontSize: 14, 
              color: '#4b5563', 
              lineHeight: 1.8 
            }}>
              <p style={{ marginBottom: 16 }}>
                {lang === 'zh' 
                  ? '感谢所有为这个项目做出贡献的人。' 
                  : 'Thank you to everyone who contributed to this project.'}
              </p>
              <div style={{ marginTop: 24 }}>
                <h3 style={{ 
                  fontSize: 16, 
                  fontWeight: 600, 
                  marginBottom: 12, 
                  color: '#1f2937' 
                }}>
                  {lang === 'zh' ? '小志愿者' : 'Little Volunteers'}
                </h3>
                <ul style={{ 
                  listStyle: 'none', 
                  padding: 0, 
                  margin: 0 
                }}>
                  <li style={{ marginBottom: 8 }}>Bob Xu</li>
                  <li style={{ marginBottom: 8 }}>Janice Xu</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => setShowCredits(false)}
              style={{
                marginTop: 24,
                padding: '8px 16px',
                backgroundColor: '#6ba8a6',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500
              }}
            >
              {lang === 'zh' ? '关闭' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Result

