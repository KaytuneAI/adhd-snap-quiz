// scripts/convert-font-to-base64.js
// 将TTF字体文件转换为base64字符串，用于jsPDF

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const fontFiles = [
  { 
    input: path.join(__dirname, '../src/fonts/static/NotoSansSC-Regular.ttf'),
    output: path.join(__dirname, '../src/assets/fonts/NotoSansSC-Regular.base64.js'),
    name: 'NotoSansSC-Regular'
  },
  {
    input: path.join(__dirname, '../src/fonts/static/NotoSansSC-Bold.ttf'),
    output: path.join(__dirname, '../src/assets/fonts/NotoSansSC-Bold.base64.js'),
    name: 'NotoSansSC-Bold'
  }
]

// 确保输出目录存在
const outputDir = path.join(__dirname, '../src/assets/fonts')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

fontFiles.forEach(({ input, output, name }) => {
  if (!fs.existsSync(input)) {
    console.error(`❌ 字体文件不存在: ${input}`)
    return
  }

  console.log(`📝 正在转换: ${name}...`)
  
  // 读取TTF文件
  const fontBuffer = fs.readFileSync(input)
  
  // 转换为base64
  const base64 = fontBuffer.toString('base64')
  
  // 生成JS文件内容
  const jsContent = `// ${name} 字体文件 (base64)
// 此文件由 scripts/convert-font-to-base64.js 自动生成
// 请勿手动编辑

export default "${base64}"
`

  // 写入文件
  fs.writeFileSync(output, jsContent, 'utf8')
  
  console.log(`✅ 已生成: ${output}`)
  console.log(`   大小: ${(base64.length / 1024).toFixed(2)} KB (base64)`)
})

console.log('\n✨ 字体转换完成！')

