import { Routes, Route } from 'react-router-dom'
import MenuPage from './pages/MenuPage.jsx'
import CartPage from './pages/CartPage.jsx'
import OrderTrackingPage from './pages/OrderTrackingPage.jsx'
import StaffLoginPage from './pages/StaffLoginPage.jsx'
import StaffDashboardPage from './pages/StaffDashboardPage.jsx'
import RequireStaff from './components/RequireStaff.jsx'

// App lists every page (route) in the app.
function App() {
  return (
    <Routes>
      {/* Customer pages */}
      <Route path="/" element={<MenuPage />} />
      <Route path="/cart" element={<CartPage />} />
      {/* :orderId is a URL parameter, e.g. /order/3f2a... */}
      <Route path="/order/:orderId" element={<OrderTrackingPage />} />

      {/* Staff pages */}
      <Route path="/staff/login" element={<StaffLoginPage />} />
      <Route
        path="/staff"
        element={
          <RequireStaff>
            <StaffDashboardPage />
          </RequireStaff>
        }
      />
    </Routes>
  )
}

export default App
