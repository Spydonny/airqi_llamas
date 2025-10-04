import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import MapPage from './pages/MapPage'
import DashboardPage from './pages/DashboardPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/dashboard/:lat/:lon" element={<DashboardPage/>} />
      </Routes>
    </Router>
  )
}

export default App
