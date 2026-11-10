import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { formatPrice } from '../lib/formatPrice'
import { useCart } from '../context/cartContext'

const MAX_NAME_LENGTH = 50

function CartPage() {
  const { items, totalPrice, changeQuantity, removeItem, clearCart } = useCart()
  const navigate = useNavigate()

  const [customerName, setCustomerName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault() // stop the browser reloading the page
    setErrorMessage('')

    // Check the name before talking to the database.
    const name = customerName.trim()
    if (name === '') {
      setErrorMessage('Please enter your name so we can call you when your order is ready.')
      return
    }
    if (name.length > MAX_NAME_LENGTH) {
      setErrorMessage(`Please keep your name to ${MAX_NAME_LENGTH} characters or fewer.`)
      return
    }

    // Only send which items and how many. No prices: the database works
    // out the prices and total itself, so they can't be tampered with.
    const orderItems = items.map((line) => ({
      menu_item_id: line.id,
      quantity: line.quantity,
    }))

    setSubmitting(true)
    const { data, error } = await supabase.rpc('place_order', {
      p_customer_name: name,
      p_items: orderItems,
    })

    if (error) {
      console.error(error)
      setErrorMessage(
        "Sorry, we couldn't place your order. Please check your cart and try again."
      )
      setSubmitting(false)
      return
    }

    // Depending on how the function is written, Supabase may return a single
    // object or a list with one row, so handle both.
    const order = Array.isArray(data) ? data[0] : data

    clearCart()
    // The tracking page loads the order itself, so the link alone is enough.
    navigate(`/order/${order.order_id}`)
  }

  if (items.length === 0) {
    return (
      <main className="page">
        <h1 className="page-title">Your cart</h1>
        <p className="message">Your cart is empty.</p>
        <p className="center">
          <Link to="/menu" className="button button-secondary">
            Browse the menu
          </Link>
        </p>
      </main>
    )
  }

  return (
    <main className="page">
      <Link to="/menu" className="back-link">
        <span aria-hidden="true">←</span>&nbsp;Back to menu
      </Link>
      <h1 className="page-title">Your cart</h1>

      <ul className="cart-list">
        {items.map((line) => (
          <li key={line.id} className="cart-line">
            <div className="cart-line-info">
              <span className="cart-line-name">{line.name}</span>
              <span className="muted">{formatPrice(line.price)} each</span>
            </div>

            <div className="quantity-controls">
              <button
                type="button"
                onClick={() => changeQuantity(line.id, -1)}
                aria-label={`Remove one ${line.name}`}
                disabled={submitting}
              >
                −
              </button>
              <span className="quantity-value" aria-label={`Quantity ${line.quantity}`}>
                {line.quantity}
              </span>
              <button
                type="button"
                onClick={() => changeQuantity(line.id, 1)}
                aria-label={`Add one ${line.name}`}
                disabled={submitting}
              >
                +
              </button>
            </div>

            <span className="cart-line-total">
              {formatPrice(line.price * line.quantity)}
            </span>

            <button
              type="button"
              className="link-button"
              onClick={() => removeItem(line.id)}
              disabled={submitting}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <p className="cart-total">
        Total <strong>{formatPrice(totalPrice)}</strong>
      </p>

      <form className="checkout-form" onSubmit={handleSubmit}>
        <label htmlFor="customer-name">Your name</label>
        <p id="customer-name-hint" className="field-hint">
          We'll use this to find you when your order is ready.
        </p>
        <input
          id="customer-name"
          aria-describedby="customer-name-hint"
          type="text"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          maxLength={MAX_NAME_LENGTH}
          required
          autoComplete="given-name"
          disabled={submitting}
        />

        {errorMessage && (
          <p className="message error" role="alert">
            {errorMessage}
          </p>
        )}

        <button type="submit" className="button button-large" disabled={submitting}>
          {submitting ? 'Placing order…' : 'Place order'}
        </button>
      </form>
    </main>
  )
}

export default CartPage
