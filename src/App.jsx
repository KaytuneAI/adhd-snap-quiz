import { Routes, Route } from 'react-router-dom'
import Intro from './pages/Intro.jsx'
import Quiz from './pages/Quiz.jsx'
import Result from './pages/Result.jsx'

function App() {
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

