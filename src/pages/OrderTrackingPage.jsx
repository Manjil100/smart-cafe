import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { formatPrice } from '../lib/formatPrice'
import { formatWait } from '../lib/formatWait'
import {
  customerPaymentLabel,
  isPaid,
  startCardCheckout,
  verifyCardPayment,
} from '../lib/payments'

// The four steps an order moves through, in order.
const STEPS = [
  { status: 'pending', label: 'Pending', message: "We've got your order." },
  { status: 'preparing', label: 'Preparing', message: "We're making your order now." },
  { status: 'ready', label: 'Ready', message: "Your order is ready. We'll bring it out to you." },
  { status: 'completed', label: 'Completed', message: 'Order complete. Enjoy!' },
]

const POLL_INTERVAL_MS = 20000 // backup refresh every 20 seconds

// e.g. "Wed 10:42 am"
const timeFormatter = new Intl.DateTimeFormat('en-NZ', {
  weekday: 'short',
  hour: 'numeric',
  minute: '2-digit',
})

function OrderTrackingPage() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [pageState, setPageState] = useState('loading') // 'loading' | 'ready' | 'notfound' | 'error'

  // Messages that arrive with the page, read once when it first opens:
  // - ?payment=success or ?payment=cancelled when Stripe sends the customer back
  // - an error from the cart page if card checkout couldn't start
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [returnedFromStripe] = useState(() => searchParams.get('payment'))
  const [paymentError, setPaymentError] = useState(() => location.state?.paymentError ?? '')
  const [startingCheckout, setStartingCheckout] = useState(false)

  // Fetch the latest order details. Used by the first load, live updates,
  // the 20-second backup and when the tab regains focus.
  // useCallback keeps the same function between renders, so the effects
  // below don't restart every time the page re-renders.
  const loadOrder = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_order_status', {
      p_order_id: orderId,
    })

    if (error) {
      // 22P02 = the ID in the link isn't a valid UUID, so it can't be an order.
      if (error.code === '22P02') {
        setPageState('notfound')
        return
      }
      console.error(error)
      // If a background refresh fails, keep showing the last known order.
      setPageState((current) => (current === 'ready' ? 'ready' : 'error'))
      return
    }

    // Handle the function returning either one object or a one-row list.
    const result = Array.isArray(data) ? (data[0] ?? null) : data
    if (!result) {
      setPageState('notfound')
      return
    }

    // Several refreshes can be in flight at once. Ignore a reply that is
    // older than what we already show, so the status never jumps backwards.
    setOrder((current) =>
      current && new Date(result.updated_at) < new Date(current.updated_at)
        ? current
        : result
    )
    setPageState('ready')
  }, [orderId])

  // Effect 1: first load + live updates through a public broadcast channel.
  useEffect(() => {
    // The linter can't tell that loadOrder only sets state after an `await`
    // (i.e. not synchronously), so this warning is a false positive here.
    // eslint-disable-next-line react/set-state-in-effect
    loadOrder()

    const channel = supabase
      .channel(`order:${orderId}`)
      .on('broadcast', { event: 'status_changed' }, () => {
        loadOrder() // the message just says "something changed", so re-fetch
      })
      .subscribe()

    // Cleanup: leave the channel when the page closes.
    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, loadOrder])

  // Effect 2: backup refreshes, in case a broadcast message is missed.
  const currentStatus = order?.status
  useEffect(() => {
    // Nothing more to wait for once the order is completed or doesn't exist.
    if (currentStatus === 'completed' || pageState === 'notfound') return

    const intervalId = setInterval(loadOrder, POLL_INTERVAL_MS)
    window.addEventListener('focus', loadOrder) // customer comes back to the tab

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('focus', loadOrder)
    }
  }, [currentStatus, pageState, loadOrder])

  // Effect 3: tidy the URL. We've already saved the messages above, so
  // replace "/order/<id>?payment=success" with "/order/<id>". This also
  // drops the cart's error, so a refresh doesn't show it again.
  useEffect(() => {
    if (searchParams.has('payment') || location.state) {
      navigate(location.pathname, { replace: true })
    }
  }, [searchParams, location, navigate])

  // Effect 4: for an unpaid card order, ask the server to check with Stripe
  // (in case the customer paid but we haven't heard yet), then reload.
  // The ref makes sure this only happens once per visit.
  const needsVerify =
    order?.payment_method === 'card' && order?.payment_status !== 'paid'
  const verifiedRef = useRef(false)
  useEffect(() => {
    if (!needsVerify || verifiedRef.current) return
    verifiedRef.current = true

    async function verifyThenReload() {
      await verifyCardPayment(orderId)
      await loadOrder()
    }
    verifyThenReload()
  }, [needsVerify, orderId, loadOrder])

  // "Pay now": start a new Stripe checkout for this order.
  async function handlePayNow() {
    setPaymentError('')
    setStartingCheckout(true)
    const { error } = await startCardCheckout(orderId)
    // On success the browser has left for Stripe; we only get here on failure.
    if (error) {
      setPaymentError(error)
      setStartingCheckout(false)
    }
  }

  if (pageState === 'loading') {
    return (
      <main className="page">
        <p className="message">Loading your order…</p>
      </main>
    )
  }

  if (pageState === 'notfound') {
    return (
      <main className="page center">
        <h1 className="page-title">Order not found</h1>
        <p className="muted">
          We couldn't find an order for this link. Please check the link is
          complete, or ask our staff for help.
        </p>
        <Link to="/menu" className="button button-secondary">
          Back to menu
        </Link>
      </main>
    )
  }

  if (pageState === 'error') {
    return (
      <main className="page center">
        <p className="message error" role="alert">
          Sorry, we couldn't load your order right now. Please check your
          connection and try again.
        </p>
        <button
          type="button"
          className="button button-secondary"
          onClick={() => {
            setPageState('loading')
            loadOrder()
          }}
        >
          Try again
        </button>
      </main>
    )
  }

  // pageState is 'ready' from here on.
  const paid = isPaid(order)
  // Unpaid card orders are hidden from the kitchen until payment goes through.
  const awaitingCard = order.payment_method === 'card' && !paid

  const currentIndex = STEPS.findIndex((step) => step.status === order.status)
  let statusMessage =
    currentIndex >= 0 ? STEPS[currentIndex].message : `Status: ${order.status}`
  if (awaitingCard && order.status === 'pending') {
    statusMessage = "We'll start your order once your payment goes through."
  }

  // Only show the estimate while the order is still being worked on,
  // the kitchen can see it, and the database sent a number.
  const showEstimate =
    (order.status === 'pending' || order.status === 'preparing') &&
    !awaitingCard &&
    typeof order.estimated_minutes === 'number'

  // Message for customers coming back from Stripe.
  let returnMessage = ''
  if (returnedFromStripe === 'success') {
    returnMessage = paid
      ? 'Thanks, your payment went through.'
      : "Thanks! We're confirming your payment…"
  } else if (returnedFromStripe === 'cancelled' && !paid) {
    returnMessage = "Payment was cancelled. Your order is saved. Use Pay now when you're ready."
  }

  return (
    <main className="page">
      <header className="order-header">
        <p className="muted">Order number</p>
        <h1 className="order-number">{order.order_number}</h1>
        <p className="muted">
          For {order.customer_name} · placed{' '}
          {timeFormatter.format(new Date(order.created_at))}
        </p>
      </header>

      {/* aria-live: screen readers read this out whenever the status changes */}
      <p className="order-status-message" aria-live="polite">
        {statusMessage}
      </p>

      {/* Outside the live region, so it isn't re-announced on every refresh */}
      {showEstimate && (
        <p className="order-estimate">
          Ready in <strong>{formatWait(order.estimated_minutes)}</strong>
        </p>
      )}

      {/* Payment */}
      <section className="payment-panel" aria-labelledby="payment-heading">
        <h2 id="payment-heading" className="sr-only">
          Payment
        </h2>

        {returnMessage && (
          <p className="message payment-return" role="status">
            {returnMessage}
          </p>
        )}

        {paymentError && (
          <p className="message error" role="alert">
            Online payment couldn't start: {paymentError}
            {paymentError.endsWith('.') ? '' : '.'} Please try Pay now again,
            or ask our staff for help.
          </p>
        )}

        <p className={`payment-status ${paid ? 'payment-status-paid' : ''}`}>
          {paid && <span aria-hidden="true">✓ </span>}
          {customerPaymentLabel(order)}
        </p>

        {awaitingCard && (
          <button
            type="button"
            className="button button-large"
            onClick={handlePayNow}
            disabled={startingCheckout}
          >
            {startingCheckout ? 'Opening secure payment…' : 'Pay now'}
          </button>
        )}
      </section>

      <ol className="progress" aria-label="Order progress">
        {STEPS.map((step, index) => {
          let state = 'upcoming'
          if (index < currentIndex) state = 'done'
          if (index === currentIndex) state = 'current'

          return (
            <li
              key={step.status}
              className={`progress-step progress-step-${state}`}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              <span className="progress-dot" aria-hidden="true">
                {state === 'done' ? '✓' : index + 1}
              </span>
              <span className="progress-label">{step.label}</span>
            </li>
          )
        })}
      </ol>

      <section aria-labelledby="order-items-heading">
        <h2 id="order-items-heading" className="section-title">
          Your order
        </h2>
        <ul className="order-items">
          {order.items.map((item, index) => (
            <li key={index} className="order-item">
              <span>
                {item.quantity} × {item.name}
              </span>
              <span>{formatPrice(item.unit_price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="cart-total">
          Total <strong>{formatPrice(order.total)}</strong>
        </p>
      </section>

      {order.status !== 'completed' && (
        <p className="muted center small-text">
          This page updates by itself. Keep it open, or save the link to check
          later.
        </p>
      )}

      <p className="center">
        <Link to="/menu" className="button button-secondary">
          Back to menu
        </Link>
      </p>
    </main>
  )
}

export default OrderTrackingPage
