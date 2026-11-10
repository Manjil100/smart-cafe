import { Link } from 'react-router-dom'
import { useCart } from '../context/cartContext'
import { formatPrice } from '../lib/formatPrice'

// A red bar fixed to the bottom of the screen with the cart summary.
// The whole bar is one link to the cart, so it's an easy tap target.
// It only appears when the cart has something in it.
function CartBar() {
  const { totalQuantity, totalPrice } = useCart()

  if (totalQuantity === 0) return null

  // Reads as "View cart (2) $9.00"
  return (
    <Link to="/cart" className="cart-bar">
      <span>View cart ({totalQuantity})</span>
      <span>{formatPrice(totalPrice)}</span>
    </Link>
  )
}

export default CartBar
