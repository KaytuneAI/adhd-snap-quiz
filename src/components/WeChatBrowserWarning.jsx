import { useState, useEffect } from 'react'
import './WeChatBrowserWarning.css'

/**
 * 检测是否为微信浏览器
 */
function isWeChatBrowser() {
  const ua = navigator.userAgent.toLowerCase()
  return /micromessenger/i.test(ua)
}

/**
 * 微信浏览器提示组件
 * 当检测到用户在微信中打开时，显示提示引导用户使用浏览器打开
 * 如果用户在微信中，将阻止访问问卷内容
 */
function WeChatBrowserWarning() {
  const [showWarning, setShowWarning] = useState(false)
  const [isWeChat, setIsWeChat] = useState(false)

  useEffect(() => {
    // 检查是否为微信浏览器
    if (isWeChatBrowser()) {
      setIsWeChat(true)
      setShowWarning(true)
      // 阻止页面滚动
      document.body.style.overflow = 'hidden'
    }
    
    // 清理函数
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleDismiss = () => {
    // 尝试关闭窗口（在微信中可能无法关闭，但尝试一下）
    try {
      window.close()
    } catch (e) {
      // 如果无法关闭，显示提示并阻止访问
      setShowWarning(false)
      // 记录用户已关闭提示
      sessionStorage.setItem('wechat_warning_dismissed', 'true')
      // 恢复滚动（虽然不会显示内容）
      document.body.style.overflow = ''
    }
  }

  // 如果是微信浏览器，始终显示警告（即使之前关闭过）
  if (!isWeChat || !showWarning) {
    return null
  }

  return (
    <div className="wechat-warning-overlay">
      <div className="wechat-warning-card">
        <div className="wechat-warning-header">
          <span className="wechat-warning-icon">⚠️</span>
          <h3 className="wechat-warning-title">建议使用浏览器打开</h3>
        </div>
        
        <div className="wechat-warning-content">
          <p className="wechat-warning-text">
            检测到您在微信中打开，为了确保功能正常使用，请使用浏览器打开。
          </p>
          <p className="wechat-warning-text">
            请按照以下步骤操作：
          </p>
          
          <div className="wechat-warning-steps">
            <div className="wechat-warning-step">
              <span className="step-number">1</span>
              <span className="step-text">点击右上角 <span className="step-highlight">⋯</span> 或 <span className="step-highlight">⋮</span></span>
            </div>
            <div className="wechat-warning-step">
              <span className="step-number">2</span>
              <span className="step-text">选择 <span className="step-highlight">"在浏览器中打开"</span></span>
            </div>
          </div>
        </div>

        <div className="wechat-warning-actions">
          <button 
            className="wechat-warning-button wechat-warning-button-primary"
            onClick={handleDismiss}
          >
            关闭页面
          </button>
        </div>
      </div>
    </div>
  )
}

export default WeChatBrowserWarning

