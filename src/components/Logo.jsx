function Logo({ size = 120, showText = true, showAdhd = true }) {
  return (
    <div className="logo-container" style={{ textAlign: 'center', marginBottom: showText ? 16 : 8 }}>
      <svg
        width={size}
        height={size * 0.8}
        viewBox="0 0 120 96"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', margin: '0 auto' }}
        className="logo-animated"
      >
        {/* 顶部蓝绿色圆形 */}
        <circle cx="60" cy="20" r="16" fill="#aad2d1" className="logo-circle-top" />
        
        {/* 蓝绿色弧形 - 微笑的嘴巴 */}
        <path
          className="logo-arc"
          stroke="#aad2d1"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        >
          <animate
            attributeName="d"
            values="M 30 50 Q 60 70 90 50;M 30 48 Q 60 78 90 48;M 30 50 Q 60 70 90 50"
            dur="4s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.25 0.1 0.25 1; 0.25 0.1 0.25 1"
          />
        </path>
        
        {/* 左侧红色圆形 */}
        <circle cx="30" cy="50" r="10" fill="#dd5262" className="logo-circle-left" />
        
        {/* 右侧红色圆形 */}
        <circle cx="90" cy="50" r="10" fill="#dd5262" className="logo-circle-right" />
      </svg>
      
      {showText && (
        <div style={{ marginTop: 8, textAlign: 'center', paddingTop: 0 }}>
          <div style={{ 
            fontSize: 20, 
            fontWeight: 400, 
            color: '#1f2937', 
            marginBottom: 0,
            letterSpacing: '0.4em',
            lineHeight: 1.3,
            fontFamily: '"Noto Sans SC", "Source Han Sans SC", "思源黑体", sans-serif'
          }}>
            聚心ADHD
          </div>
        </div>
      )}
    </div>
  )
}

export default Logo

