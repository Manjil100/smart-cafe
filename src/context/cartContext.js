import { createContext, useContext } from 'react'

// The context object that CartProvider fills with the cart state and actions.
export const CartContext = createContext(null)

// Any component can call useCart() to read or change the cart.
export function useCart() {
  const cart = useContext(CartContext)
  if (!cart) {
    throw new Error('useCart must be used inside <CartProvider>')
  }
  return cart
}
