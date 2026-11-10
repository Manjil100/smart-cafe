import { Link } from 'react-router-dom'
import { useCart } from '../context/cartContext'
import { formatPrice } from '../lib/formatPrice'

// A bar fixed to the bottom of the screen that shows the cart summary.
// It only appears when the cart has something in it.
function CartBar() {
  const { totalQuantity, totalPrice } = useCart()

  if (totalQuantity === 0) return null

  return (
    <div className="cart-bar">
      <span>
        {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'} ·{' '}
        <strong>{formatPrice(totalPrice)}</strong>
      </span>
      <Link to="/cart" className="button">
        View cart
      </Link>
    </div>
  )
}

export default CartBar
