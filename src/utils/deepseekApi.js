// src/utils/deepseekApi.js

// 支持 DeepSeek 和 Qwen (DashScope) 两种 API
// 通过环境变量 VITE_AI_PROVIDER 切换：'deepseek' 或 'qwen'（默认）
const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || 'qwen'

// API URL 配置
const getApiUrl = () => {
  if (AI_PROVIDER === 'deepseek') {
    return import.meta.env.DEV
      ? '/api/deepseek'  // 开发环境使用 Vite 代理
      : 'https://api.deepseek.com/v1/chat/completions'  // 生产环境
  } else {
    // Qwen (DashScope)
    return import.meta.env.DEV
      ? '/api/qwen'  // 开发环境使用 Vite 代理
      : 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'  // 生产环境
  }
}

const API_URL = getApiUrl()

// 模型配置
const getModel = () => {
  if (AI_PROVIDER === 'deepseek') {
    return 'deepseek-chat'  // DeepSeek 模型
  } else {
    return 'qwen-plus'  // Qwen 模型
  }
}

/**
 * 调用AI API生成分析（流式输出）- 支持 DeepSeek 和 Qwen
 * @param {Array} items - 题目数据
 * @param {Array} answers - 用户答案
 * @param {Object} scores - 计算出的分数
 * @param {string} lang - 语言 ('zh' 或 'en')
 * @param {string} apiKey - API密钥（DeepSeek 或 DashScope API Key）
 * @param {Function} onChunk - 流式输出回调函数，接收每个数据块
 * @returns {Promise<string>} AI生成的分析文本
 */
export async function generateAIAnalysis(items, answers, scores, lang = 'zh', apiKey, onChunk = null) {
  if (!apiKey) {
    throw new Error(`${AI_PROVIDER === 'deepseek' ? 'DeepSeek' : 'Qwen'} API key is required`)
  }

  // 构建系统提示词
  const systemPrompt = lang === 'zh'
    ? `你是一位具有儿童心理与发展行为专业背景的 AI 助手，熟悉 SNAP-IV 量表。你的核心定位是"翻译量表的人"，而非"诊断者"。

你的职责：
1. 将 SNAP-IV 量表数据转化为家庭友好的理解
2. 用温馨、鼓励、支持型语言解释行为特征
3. 提供可操作的家庭支持建议
4. 明确边界：这是初步筛查，不是医学诊断

重要原则：
- 不制造焦虑，不贴标签
- 强调"支持""发展""可塑性"
- 用词克制、专业、温暖
- 让家长看得懂、看得安心`
    : `You are an AI assistant with a professional background in child psychology and developmental behavior, familiar with the SNAP-IV scale. Your core role is to "translate the scale" for families, not to "diagnose".

Your responsibilities:
1. Translate SNAP-IV scale data into family-friendly understanding
2. Explain behavioral characteristics in warm, encouraging, supportive language
3. Provide actionable family support recommendations
4. Clearly define boundaries: this is preliminary screening, not medical diagnosis

Key principles:
- Do not create anxiety or label
- Emphasize "support", "development", "plasticity"
- Use restrained, professional, warm language
- Make it understandable and reassuring for parents`

  // 构建用户消息，包含逐题评分数据
  let userMessage = lang === 'zh'
    ? `下面我将提供 SNAP-IV 共 26 道题的逐题评分结果。
请你逐题理解与综合分析这些信息，而不要只根据总分或平均分下结论。

一、评分背景说明（请在分析时遵守）

每道题评分范围为：
0 = 完全没有 / 1 = 偶尔 / 2 = 经常 / 3 = 非常频繁

本结果来自 SNAP-IV 行为筛查量表

这是初步行为特征筛查，不是医学诊断

你的分析目标是：
👉 理解孩子的行为特点、优势与可能需要支持的地方
👉 帮助家长更好地支持孩子，而不是"贴标签"

二、逐题评分数据

`
    : `I will provide the item-by-item scoring results for all 26 items of the SNAP-IV scale.
Please understand and comprehensively analyze this information item by item, rather than drawing conclusions based only on total scores or averages.

Scoring range for each item:
0 = Not at all / 1 = Sometimes / 2 = Often / 3 = Very Often

This result comes from the SNAP-IV behavioral screening scale.

This is a preliminary behavioral screening, not a medical diagnosis.

Your analysis goal:
👉 Understand the child's behavioral characteristics, strengths, and areas that may need support
👉 Help parents better support their child, rather than "labeling"

Item-by-item scoring data:

`

  // 按维度分组题目
  const inattentionItems = []
  const hyperactivityItems = []
  const oppositionalItems = []

  items.forEach((item, idx) => {
    const score = answers[idx] ?? 0
    const itemData = {
      number: item.number || idx + 1,
      text: lang === 'zh' ? item.text_cn : item.text_en,
      score: score
    }

    if (item.domain === 'inattention') {
      inattentionItems.push(itemData)
    } else if (item.domain === 'hyperactivity_impulsivity') {
      hyperactivityItems.push(itemData)
    } else if (item.domain === 'oppositional') {
      oppositionalItems.push(itemData)
    }
  })

  // 构建逐题评分数据
  if (lang === 'zh') {
    userMessage += `（一）注意力相关（1–9）\n\n`
    inattentionItems.forEach(item => {
      userMessage += `题目${item.number}：得分 ${item.score}\n`
    })

    userMessage += `\n（二）多动 / 冲动相关（10–18）\n\n`
    hyperactivityItems.forEach(item => {
      userMessage += `题目${item.number}：得分 ${item.score}\n`
    })

    userMessage += `\n（三）对立 / 情绪调节相关（19–26）\n\n`
    oppositionalItems.forEach(item => {
      userMessage += `题目${item.number}：得分 ${item.score}\n`
    })

    userMessage += `\n三、请你按照以下【结构化方式】输出分析结果

请严格按照以下5个部分输出，每个部分用明确的标题分隔：

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【一、整体理解】

用 1–2 段话，总体描述孩子目前呈现的行为特点。

重点：
- 强调行为是连续光谱，而非"有/没有问题"的二元判断
- 说明孩子在哪些方面可能需要更多支持
- 指出孩子在哪些方面具备潜在优势
- 避免使用"障碍""异常""问题儿童"等标签化词汇

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【二、分维度解读】

对每个维度（注意力、多动冲动、情绪与对立），分别用2-3句话简洁说明：

1. 这个维度在看什么（一句话）
2. 本次结果反映了什么（用"可能""倾向"等中性语言，一句话）
3. 在真实生活中可能的表现（一句话，简要提及课堂、家庭或社交场景）

⚠️ 每个维度控制在3句话以内，不要用"明显异常""问题显著"等词汇
⚠️ 整体保持简洁，避免冗长描述

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【三、家庭支持建议】

提供具体、可操作、非药物优先的建议，每个方面用2-3句话简洁说明：

🏠 家庭环境与作息（2-3句话）
📚 学习与任务支持（2-3句话）
💬 情绪与沟通（2-3句话）
🌱 鼓励与成长心态（2-3句话）

⚠️ 不要出现"纠正""控制""必须"等词汇
✅ 使用"可以尝试""有助于""在支持下"等支持型语言
⚠️ 整体保持简洁，每个方面控制在2-3句话，避免冗长

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【四、给孩子的话】

用温柔、鼓励、理解孩子感受的语言，传达3个核心信息：
- 你不是"有问题的孩子"
- 有些事情对你来说更难，不是你的错
- 大人会和你一起想办法、一起练习

这段可以直接读给小朋友听。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【五、关于专业咨询】

用克制、专业、安心的方式说明：

- 在什么情况下"可以考虑"咨询专业人士
- 在什么情况下暂时可以先观察和家庭支持
- 明确强调：本结果仅为初步筛查，不构成医学诊断

⚠️ 语气要求：
- 不制造焦虑
- 不下结论
- 不暗示必须用药

💡 重要提示：
- 如果提到就医、看医生、咨询专业人士等，请在适当位置自然提及：
  "如需就医，可关注'聚心ADHD'公众号，获取'医院导航'服务，帮助您找到合适的专业医疗机构。"
- 这句话要自然融入，不要显得突兀或广告化

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

四、整体风格要求

语言：中文，偏家庭教育与儿童心理科普风格
立场：支持型、发展型，而非诊断型
语气：温和｜专业｜不吓人｜不贴标签｜给希望`
  } else {
    // 英文版本（简化版，因为用户主要关注中文）
    userMessage += `(1) Inattention (Items 1-9)\n\n`
    inattentionItems.forEach(item => {
      userMessage += `Item ${item.number}: Score ${item.score}\n`
    })

    userMessage += `\n(2) Hyperactivity/Impulsivity (Items 10-18)\n\n`
    hyperactivityItems.forEach(item => {
      userMessage += `Item ${item.number}: Score ${item.score}\n`
    })

    userMessage += `\n(3) Oppositional/Emotional Regulation (Items 19-26)\n\n`
    oppositionalItems.forEach(item => {
      userMessage += `Item ${item.number}: Score ${item.score}\n`
    })

    userMessage += `\nPlease provide a comprehensive analysis following the structured format:
1. Overall understanding
2. Dimension-by-dimension interpretation
3. Practical support recommendations for parents
4. When to consider professional consultation
5. A message for the child

Use warm, professional, non-labeling language.`
  }

  // 在控制台输出完整的prompt信息（开发环境）
  const startTime = Date.now()
  if (import.meta.env.DEV) {
    console.group(`🤖 ${AI_PROVIDER === 'deepseek' ? 'DeepSeek' : 'Qwen'} API Request`)
    console.log('📝 System Prompt:', systemPrompt)
    console.log('💬 User Message:', userMessage)
    console.log('📊 Full Prompt Length:', (systemPrompt + userMessage).length, 'characters')
    console.log('⏰ Request started at:', new Date().toLocaleTimeString())
    console.groupEnd()
  }

  try {
    // 使用兼容 OpenAI 格式的 API（DeepSeek 或 Qwen）
    const requestBody = {
      model: getModel(),
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      stream: true // 启用流式输出
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    // 输出响应状态
    const responseTime = Date.now()
    const requestDuration = responseTime - startTime
    if (import.meta.env.DEV) {
      console.group(`📡 ${AI_PROVIDER === 'deepseek' ? 'DeepSeek' : 'Qwen'} API Response`)
      console.log('Status:', response.status, response.statusText)
      console.log('Headers:', Object.fromEntries(response.headers.entries()))
      console.log('⏱️ Request duration:', requestDuration, 'ms', `(${(requestDuration / 1000).toFixed(2)}s)`)
    }

    if (!response.ok) {
      let errorData = {}
      let errorText = ''
      try {
        errorText = await response.text()
        errorData = errorText ? JSON.parse(errorText) : {}
      } catch (e) {
        console.warn('Failed to parse error response:', e)
        errorData = { raw: errorText }
      }
      if (import.meta.env.DEV) {
        console.error('❌ API Error:', errorData)
        console.error('❌ Raw error text:', errorText)
        console.groupEnd()
      }
      
      // 提供更友好的错误信息
      let errorMessage = errorData.error?.message || errorData.message || `API request failed: ${response.status}`
      
      if (response.status === 401) {
        errorMessage = `认证失败：API密钥无效或格式错误。请检查 VITE_${AI_PROVIDER === 'deepseek' ? 'DEEPSEEK' : 'QWEN'}_API_KEY 环境变量是否正确设置。`
        if (import.meta.env.DEV) {
          console.error('💡 提示：请确保在 .env 文件中设置了正确的 API key')
          console.error(`💡 当前使用的 provider: ${AI_PROVIDER}`)
        }
      }
      
      throw new Error(errorMessage)
    }

    // 流式解析响应
    let fullContent = ''
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    
    if (import.meta.env.DEV) {
      console.log('📡 Starting to read stream...')
    }

    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        break
      }

      // 解码数据块
      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter(line => line.trim() !== '')
      
      for (const line of lines) {
        // 跳过 SSE 格式的前缀
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6) // 移除 'data: ' 前缀
          
          // 跳过 [DONE] 标记
          if (dataStr.trim() === '[DONE]') {
            continue
          }
          
          try {
            const data = JSON.parse(dataStr)
            // API 兼容 OpenAI 格式：data.choices[0].delta.content
            const deltaContent = data.choices?.[0]?.delta?.content || ''
            
            if (deltaContent) {
              fullContent += deltaContent
              
              // 调用回调函数，实时更新内容
              if (onChunk) {
                onChunk(fullContent)
              }
              
              if (import.meta.env.DEV) {
                console.log('📝 Chunk received:', deltaContent.length, 'chars, total:', fullContent.length)
              }
            }
          } catch (parseError) {
            // 忽略解析错误（可能是部分数据）
            if (import.meta.env.DEV) {
              console.warn('⚠️ Failed to parse chunk:', parseError, 'Line:', line)
            }
          }
        }
      }
    }
    
    // 输出成功响应信息
    const totalDuration = Date.now() - startTime
    if (import.meta.env.DEV) {
      console.log('✅ Stream completed')
      console.log('📝 Total content length:', fullContent.length, 'characters')
      console.log('⏱️ Total duration:', totalDuration, 'ms', `(${(totalDuration / 1000).toFixed(2)}s)`)
      console.groupEnd()
    }
    
    return fullContent
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`❌ ${AI_PROVIDER === 'deepseek' ? 'DeepSeek' : 'Qwen'} API error:`, error)
      console.groupEnd()
    }
    throw error
  }
}

/**
 * 简单的AI测试函数 - 用于验证API是否正常工作
 * @param {string} apiKey - API密钥
 * @returns {Promise<string>} AI返回的内容
 */
export async function testAIConnection(apiKey) {
  if (!apiKey) {
    throw new Error('API key is required')
  }

  const testPrompt = '用300个字解释ADHD的SNAP-IV的方法论原理'

  const requestBody = {
    model: getModel(),
    messages: [
      {
        role: 'user',
        content: testPrompt
      }
    ],
    temperature: 0.7,
    max_tokens: 500
  }

  const startTime = Date.now()
  console.group(`🧪 ${AI_PROVIDER === 'deepseek' ? 'DeepSeek' : 'Qwen'} Connection Test`)
  console.log('📝 Test prompt:', testPrompt)
  console.log('⏰ Request started at:', new Date().toLocaleTimeString())

  try {
    const apiUrl = API_URL

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    const responseTime = Date.now()
    const requestDuration = responseTime - startTime
    console.log('📡 Response status:', response.status, response.statusText)
    console.log('⏱️ Request duration:', requestDuration, 'ms', `(${(requestDuration / 1000).toFixed(2)}s)`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Error:', errorText)
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const totalDuration = Date.now() - startTime

    console.log('✅ Response received')
    console.log('💡 Full response:', data)

    // 兼容 OpenAI 格式：data.choices[0].message.content
    let content = data.choices?.[0]?.message?.content || ''
    
    // 如果 choices 为空，尝试其他可能的格式
    if (!content && data.output) {
      content = data.output.choices?.[0]?.message?.content || ''
    }

    console.log('📝 Content length:', content.length, 'characters')
    console.log('📝 Content preview:', content.substring(0, 200))
    console.log('⏱️ Total duration:', totalDuration, 'ms', `(${(totalDuration / 1000).toFixed(2)}s)`)
    console.groupEnd()

    if (!content) {
      console.warn('⚠️ Empty content in response. Full data:', data)
      throw new Error('Empty content in API response')
    }

    return content
  } catch (error) {
    console.error('❌ Test failed:', error)
    console.groupEnd()
    throw error
  }
}

