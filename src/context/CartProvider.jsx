import { useState } from 'react'
import { CartContext } from './cartContext'

// Holds the cart in React state and shares it with the whole app.
// Each cart line looks like: { id, name, price, quantity }
// Note: prices here are only for display. The database calculates the real
// total when the order is placed.
function CartProvider({ children }) {
  const [items, setItems] = useState([])

  // Add one of a menu item. If it's already in the cart, increase its quantity.
  function addItem(menuItem) {
    setItems((current) => {
      const existing = current.find((line) => line.id === menuItem.id)
      if (existing) {
        return current.map((line) =>
          line.id === menuItem.id
            ? { ...line, quantity: line.quantity + 1 }
            : line
        )
      }
      return [
        ...current,
        { id: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: 1 },
      ]
    })
  }

  // Change a quantity by +1 or -1. Dropping to 0 removes the line.
  function changeQuantity(id, change) {
    setItems((current) =>
      current
        .map((line) =>
          line.id === id ? { ...line, quantity: line.quantity + change } : line
        )
        .filter((line) => line.quantity > 0)
    )
  }

  function removeItem(id) {
    setItems((current) => current.filter((line) => line.id !== id))
  }

  function clearCart() {
    setItems([])
  }

  // Values worked out from the items, so they never get out of sync.
  const totalQuantity = items.reduce((sum, line) => sum + line.quantity, 0)
  const totalPrice = items.reduce((sum, line) => sum + line.price * line.quantity, 0)

  const value = {
    items,
    totalQuantity,
    totalPrice,
    addItem,
    changeQuantity,
    removeItem,
    clearCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export default CartProvider
