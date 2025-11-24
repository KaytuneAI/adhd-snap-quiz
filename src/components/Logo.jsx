function Logo({ size = 120, showText = true, showAdhd = true }) {
  return (
    <div className="logo-container" style={{ textAlign: 'center', marginBottom: showText ? 16 : 8 }}>
      <svg
        width={size}
        height={size * 0.8}
        viewBox="0 0 120 96"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', margin: '0 auto' }}
      >
        {/* 顶部浅蓝色圆形 */}
        <circle cx="60" cy="20" r="16" fill="#93c5fd" />
        
        {/* 浅蓝色弧形 */}
        <path
          d="M 30 50 Q 60 70 90 50"
          stroke="#93c5fd"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* 左侧红色圆形 */}
        <circle cx="30" cy="50" r="10" fill="#fca5a5" />
        
        {/* 右侧红色圆形 */}
        <circle cx="90" cy="50" r="10" fill="#fca5a5" />
      </svg>
      
      {showText && (
        <div style={{ marginTop: 8 }}>
          <div style={{ 
            fontSize: showAdhd ? 18 : 20, 
            fontWeight: 600, 
            color: '#1f2937', 
            marginBottom: 0,
            letterSpacing: '0.02em',
            lineHeight: 1.3
          }}>
            聚心ADHD公益基金
          </div>
        </div>
      )}
    </div>
  )
}

export default Logo

