import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import CartProvider from './context/CartProvider.jsx'
import AuthProvider from './context/AuthProvider.jsx'
import './index.css'
import App from './App.jsx'

// BrowserRouter wraps the whole app so any component can use routing.
// AuthProvider knows who is signed in (staff); CartProvider shares one cart.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
