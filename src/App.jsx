import { Routes, Route } from 'react-router-dom'
import MenuPage from './pages/MenuPage.jsx'
import CartPage from './pages/CartPage.jsx'
import OrderTrackingPage from './pages/OrderTrackingPage.jsx'

// App lists every page (route) in the app.
function App() {
  return (
    <Routes>
      <Route path="/" element={<MenuPage />} />
      <Route path="/cart" element={<CartPage />} />
      {/* :orderId is a URL parameter, e.g. /order/3f2a... */}
      <Route path="/order/:orderId" element={<OrderTrackingPage />} />
    </Routes>
  )
}

export default App
