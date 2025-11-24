function Logo({ size = 120, showText = true }) {
  return (
    <div className="logo-container" style={{ textAlign: 'center', marginBottom: showText ? 24 : 16 }}>
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
        <div style={{ marginTop: 16 }}>
          <div style={{ 
            fontSize: 22, 
            fontWeight: 600, 
            color: '#1f2937', 
            marginBottom: 6,
            letterSpacing: '0.02em'
          }}>
            聚心
          </div>
          <div style={{ 
            fontSize: 13, 
            color: '#6b7280', 
            letterSpacing: '0.15em',
            fontWeight: 500
          }}>
            ADHD
          </div>
        </div>
      )}
    </div>
  )
}

export default Logo

