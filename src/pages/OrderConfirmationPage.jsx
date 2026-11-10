import { Link, useLocation, useParams } from 'react-router-dom'
import { formatPrice } from '../lib/formatPrice'

// Simple confirmation shown after placing an order.
// The order number comes from the cart page (navigation state).
// If the page is refreshed that state is lost, so we show a fallback.
// Order tracking (loading the order from the database) comes in the next step.
function OrderConfirmationPage() {
  const { orderId } = useParams()
  const location = useLocation()
  const orderNumber = location.state?.orderNumber
  const total = location.state?.total

  return (
    <main className="page center">
      <h1>Thank you!</h1>

      {orderNumber ? (
        <>
          <p>Your order number is</p>
          <p className="order-number">{orderNumber}</p>
          {total != null && <p>Total: {formatPrice(total)}</p>}
        </>
      ) : (
        <p>Your order has been received.</p>
      )}

      <p className="muted">
        Keep this page open, or save its link, to check on your order.
      </p>
      <p className="muted small">Order reference: {orderId}</p>

      <p>
        <Link to="/" className="button">
          Back to menu
        </Link>
      </p>
    </main>
  )
}

export default OrderConfirmationPage
