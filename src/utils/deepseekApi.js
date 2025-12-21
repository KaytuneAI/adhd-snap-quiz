// src/utils/deepseekApi.js

// 使用阿里云 DashScope 兼容 OpenAI 格式的接口
// 通过 Vite 代理解决 CORS 问题
const QWEN_API_URL = import.meta.env.DEV 
  ? '/api/qwen'  // 开发环境使用 Vite 代理
  : 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'  // 生产环境需要后端代理

/**
 * 调用Qwen API生成AI分析
 * @param {Array} items - 题目数据
 * @param {Array} answers - 用户答案
 * @param {Object} scores - 计算出的分数
 * @param {string} lang - 语言 ('zh' 或 'en')
 * @param {string} apiKey - Qwen API密钥（DashScope API Key）
 * @returns {Promise<string>} AI生成的分析文本
 */
export async function generateAIAnalysis(items, answers, scores, lang = 'zh', apiKey) {
  if (!apiKey) {
    throw new Error('Qwen API key is required')
  }

  // 构建系统提示词
  const systemPrompt = lang === 'zh'
    ? `你是一位具有儿童心理与发展行为专业背景的 AI 助手，熟悉 SNAP-IV 量表，同时非常擅长用温馨、鼓励、儿童友好的方式向家长和孩子解释结果，并给出可操作、生活化的建议。`
    : `You are an AI assistant with a professional background in child psychology and developmental behavior, familiar with the SNAP-IV scale, and very good at explaining results to parents and children in a warm, encouraging, and child-friendly way, and providing actionable, life-oriented advice.`

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

① 整体理解（写给家长，也能让孩子听懂）

用不超过 1–2 段话，总体描述孩子目前呈现的行为特点

重点放在：

行为是连续光谱，而非"有 / 没有问题"

孩子在哪些方面比较辛苦

孩子在哪些方面具备潜在优势

⚠️ 请避免使用"障碍""异常""问题儿童"等标签化词汇

② 分维度解读（注意力 / 多动冲动 / 情绪与对立）

对每一类维度，请分别说明：

从题目分布本身看，比较突出的行为模式是什么

这些表现在真实生活中可能意味着什么（课堂、家庭、社交）

哪些是需要支持的地方，哪些是发展中的正常挑战

③ 给家长的【实用支持建议】（重点）

请给出 具体、可操作、非药物优先 的建议，例如：

学习与作业情境

日常作息与环境结构

情绪调节与亲子互动

鼓励方式与反馈方式

建议要：

可执行（不是空泛心理建议）

偏向"支持型"，而不是"纠正型"

④ 是否需要就医？（非常重要的合规说明）

请用非常克制、专业、安心的方式说明：

在什么情况下 "可以考虑" 咨询专业人士

在什么情况下 暂时可以先观察和家庭支持

明确强调：

本结果仅为初步筛查，不构成医学诊断

⚠️ 语气要求：

不制造焦虑

不下结论

不暗示必须用药

⑤ 给孩子的一段话（可直接读给小朋友听）

用 温柔、鼓励、理解孩子感受的语言

传达 3 个核心信息：

你不是"有问题的孩子"

有些事情对你来说更难，不是你的错

大人会和你一起想办法、一起练习

四、整体风格要求（非常重要）

语言：中文，偏家庭教育与儿童心理科普风格

立场：支持型、发展型，而非诊断型

语气关键词：
温和｜专业｜不吓人｜不贴标签｜给希望`
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
    console.group('🤖 Qwen API Request')
    console.log('📝 System Prompt:', systemPrompt)
    console.log('💬 User Message:', userMessage)
    console.log('📊 Full Prompt Length:', (systemPrompt + userMessage).length, 'characters')
    console.log('⏰ Request started at:', new Date().toLocaleTimeString())
    console.groupEnd()
  }

  try {
    // Qwen API 使用兼容 OpenAI 格式（阿里云百炼）
    const requestBody = {
      model: 'qwen-turbo', // 可以使用 qwen-turbo, qwen-plus, qwen-max, qwen-max-longcontext
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
      max_tokens: 2000
    }

    const response = await fetch(QWEN_API_URL, {
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
      console.group('📡 Qwen API Response')
      console.log('Status:', response.status, response.statusText)
      console.log('Headers:', Object.fromEntries(response.headers.entries()))
      console.log('⏱️ Request duration:', requestDuration, 'ms', `(${(requestDuration / 1000).toFixed(2)}s)`)
    }

    if (!response.ok) {
      let errorData = {}
      try {
        const text = await response.text()
        errorData = text ? JSON.parse(text) : {}
      } catch (e) {
        console.warn('Failed to parse error response:', e)
      }
      if (import.meta.env.DEV) {
        console.error('❌ API Error:', errorData)
        console.groupEnd()
      }
      throw new Error(errorData.error?.message || `API request failed: ${response.status}`)
    }

    // 解析响应
    let data
    try {
      const text = await response.text()
      if (import.meta.env.DEV) {
        console.log('📄 Raw response text length:', text.length)
      }
      data = JSON.parse(text)
    } catch (parseError) {
      if (import.meta.env.DEV) {
        console.error('❌ Failed to parse response JSON:', parseError)
        console.groupEnd()
      }
      throw new Error('Failed to parse API response')
    }
    
    // 输出成功响应信息
    const totalDuration = Date.now() - startTime
    if (import.meta.env.DEV) {
      console.log('✅ Response received')
      // Qwen API 兼容 OpenAI 格式：data.choices[0].message.content
      const contentLength = data.choices?.[0]?.message?.content?.length || 0
      console.log('📝 Response length:', contentLength, 'characters')
      console.log('🔢 Tokens used:', data.usage?.total_tokens || 'N/A')
      console.log('⏱️ Total duration:', totalDuration, 'ms', `(${(totalDuration / 1000).toFixed(2)}s)`)
      console.log('💡 Full response:', data)
      console.groupEnd()
    }

    // Qwen API 兼容 OpenAI 格式：data.choices[0].message.content
    let content = data.choices?.[0]?.message?.content || ''
    
    // 如果 choices 为空，尝试其他可能的格式
    if (!content && data.output) {
      content = data.output.choices?.[0]?.message?.content || ''
    }
    
    if (import.meta.env.DEV) {
      if (!content) {
        console.warn('⚠️ Empty content in response. Full data:', data)
        console.warn('⚠️ Available paths:', {
          'data.choices': data.choices,
          'data.output': data.output,
          'data.choices[0]': data.choices?.[0],
          'data.output.choices[0]': data.output?.choices?.[0]
        })
      } else {
        console.log('✅ Content extracted successfully, length:', content.length)
      }
    }
    
    return content
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('❌ Qwen API error:', error)
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
    model: 'qwen-turbo',
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
  console.group('🧪 AI Connection Test')
  console.log('📝 Test prompt:', testPrompt)
  console.log('⏰ Request started at:', new Date().toLocaleTimeString())

  try {
    const apiUrl = import.meta.env.DEV 
      ? '/api/qwen'  // 开发环境使用代理
      : 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'

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

