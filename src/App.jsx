import { Routes, Route } from 'react-router-dom'
import MenuPage from './pages/MenuPage.jsx'

// App lists every page (route) in the app.
// More routes (cart, order tracking, staff dashboard) will be added here later.
function App() {
  return (
    <Routes>
      <Route path="/" element={<MenuPage />} />
    </Routes>
  )
}

export default App
