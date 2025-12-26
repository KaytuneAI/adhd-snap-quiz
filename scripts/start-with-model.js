// scripts/start-with-model.js
// 启动脚本：让用户选择AI模型

import { spawn } from 'child_process'
import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function selectModel() {
  console.log('\n🤖 请选择要使用的AI模型：\n')
  console.log('1. Qwen (阿里云 DashScope) - 默认')
  console.log('2. DeepSeek\n')
  
  const answer = await question('请输入选项 (1 或 2，直接回车使用默认): ')
  
  let provider = 'qwen'
  if (answer.trim() === '2') {
    provider = 'deepseek'
    console.log('✅ 已选择: DeepSeek\n')
  } else {
    console.log('✅ 已选择: Qwen (默认)\n')
  }
  
  rl.close()
  return provider
}

async function start() {
  const provider = await selectModel()
  
  // 设置环境变量并启动Vite
  const env = {
    ...process.env,
    VITE_AI_PROVIDER: provider
  }
  
  console.log(`🚀 启动开发服务器 (使用 ${provider === 'deepseek' ? 'DeepSeek' : 'Qwen'} 模型)...\n`)
  
  const vite = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    env: env
  })
  
  vite.on('close', (code) => {
    process.exit(code)
  })
}

start().catch(console.error)




