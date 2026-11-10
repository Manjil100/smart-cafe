import { Routes, Route } from 'react-router-dom'
import CustomerLayout from './components/CustomerLayout.jsx'
import LandingPage from './pages/LandingPage.jsx'
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
      {/* Customer pages share the top nav from CustomerLayout */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        {/* :orderId is a URL parameter, e.g. /order/3f2a... */}
        <Route path="/order/:orderId" element={<OrderTrackingPage />} />
      </Route>

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
