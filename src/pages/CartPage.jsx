import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { formatPrice } from '../lib/formatPrice'
import { useCart } from '../context/cartContext'
import { startCardCheckout } from '../lib/payments'

const MAX_NAME_LENGTH = 50

const PAYMENT_OPTIONS = [
  { value: 'counter', label: 'Pay at the counter', hint: 'Pay when you collect or we bring it out.' },
  { value: 'card', label: 'Pay online by card', hint: "You'll go to a secure Stripe page (test mode)." },
]

function CartPage() {
  const { items, totalPrice, changeQuantity, removeItem, clearCart } = useCart()
  const navigate = useNavigate()

  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('') // '' = not chosen yet
  const [submitting, setSubmitting] = useState(false)
  const [redirecting, setRedirecting] = useState(false) // on the way to Stripe
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
    if (paymentMethod !== 'counter' && paymentMethod !== 'card') {
      setErrorMessage('Please choose how you would like to pay.')
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
      p_payment_method: paymentMethod,
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

    // The order now exists, so the cart is no longer needed.
    // For card, show a "taking you to payment" message instead of
    // flashing the empty cart while Stripe loads.
    if (paymentMethod === 'card') setRedirecting(true)
    clearCart()
    const trackingPath = `/order/${order.order_id}`

    if (paymentMethod === 'counter') {
      // The tracking page loads the order itself, so the link alone is enough.
      navigate(trackingPath)
      return
    }

    // Card: send the customer to Stripe. On success the browser leaves our
    // site, so nothing below runs. If it fails, the order still exists, so
    // go to the tracking page and pass the error along to show there.
    const { error: checkoutError } = await startCardCheckout(order.order_id)
    if (checkoutError) {
      navigate(trackingPath, { state: { paymentError: checkoutError } })
    }
  }

  if (redirecting) {
    return (
      <main className="page">
        <p className="message" role="status">
          Order placed. Taking you to secure payment…
        </p>
      </main>
    )
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

        {/* fieldset + legend: screen readers read the question with each option */}
        <fieldset className="payment-options" disabled={submitting}>
          <legend>How would you like to pay?</legend>
          {PAYMENT_OPTIONS.map((option) => (
            <label key={option.value} className="payment-option">
              <input
                type="radio"
                name="payment-method"
                value={option.value}
                checked={paymentMethod === option.value}
                onChange={() => setPaymentMethod(option.value)}
                required
              />
              <span>
                <span className="payment-option-label">{option.label}</span>
                <span className="payment-option-hint">{option.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {errorMessage && (
          <p className="message error" role="alert">
            {errorMessage}
          </p>
        )}

        <button type="submit" className="button button-large" disabled={submitting}>
          {submitting
            ? 'Placing order…'
            : paymentMethod === 'card'
              ? 'Place order and pay'
              : 'Place order'}
        </button>
      </form>
    </main>
  )
}

export default CartPage
