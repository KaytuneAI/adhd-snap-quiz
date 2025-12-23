import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Intro from './pages/Intro.jsx'
import Quiz from './pages/Quiz.jsx'
import Result from './pages/Result.jsx'
import { testAIConnection } from './utils/deepseekApi'

function App() {
  // 测试AI连接 - 在开发环境下暴露到window对象，方便在控制台调用
  useEffect(() => {
    if (import.meta.env.DEV) {
      window.testAIConnection = async () => {
        const aiProvider = import.meta.env.VITE_AI_PROVIDER || 'qwen'
        const apiKey = aiProvider === 'deepseek' 
          ? (import.meta.env.VITE_DEEPSEEK_API_KEY || '')
          : (import.meta.env.VITE_QWEN_API_KEY || '')
        if (!apiKey) {
          console.error(`❌ API key not found. Please set VITE_${aiProvider === 'deepseek' ? 'DEEPSEEK' : 'QWEN'}_API_KEY in .env file`)
          return
        }
        try {
          const aiProvider = import.meta.env.VITE_AI_PROVIDER || 'qwen'
          console.log(`🧪 Starting ${aiProvider === 'deepseek' ? 'DeepSeek' : 'Qwen'} connection test...`)
          const result = await testAIConnection(apiKey)
          console.log('✅ Test successful!')
          console.log('📝 Result:', result)
          alert('AI测试成功！\n\n结果：' + result.substring(0, 200) + '...')
          return result
        } catch (error) {
          console.error('❌ Test failed:', error)
          alert('AI测试失败：' + error.message)
          throw error
        }
      }
      console.log('💡 在控制台输入 testAIConnection() 来测试AI连接')
    }
  }, [])

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Intro />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/result" element={<Result />} />
      </Routes>
    </div>
  )
}

export default App

