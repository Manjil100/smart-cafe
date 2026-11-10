import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { formatPrice } from '../lib/formatPrice'
import { periodStart, summariseSales } from '../lib/salesSummary'
import { isPaid, staffPaymentLabel } from '../lib/payments'

const PERIODS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Last 7 days' },
  { id: 'all', label: 'All time' },
]

// e.g. "Wed 12 Nov, 10:42 am"
const dateTimeFormatter = new Intl.DateTimeFormat('en-NZ', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
})

function StaffHistoryPage() {
  const [period, setPeriod] = useState('today')
  // The last result, remembered with the period it was loaded for:
  // { period, orders, error }
  const [result, setResult] = useState(null)

  // Load completed orders whenever the period changes.
  useEffect(() => {
    let ignore = false

    async function loadHistory() {
      let query = supabase
        .from('orders')
        .select(
          'id, order_number, customer_name, status, total, created_at, payment_method, payment_status, order_items(quantity, unit_price, menu_items(name))'
        )
        .eq('status', 'completed')
        .order('created_at', { ascending: false }) // newest first

      const start = periodStart(period)
      if (start) query = query.gte('created_at', start.toISOString())

      const { data, error } = await query
      if (ignore) return // the period changed while we were loading
      if (error) console.error(error)
      setResult({ period, orders: data ?? [], error })
    }

    loadHistory()
    return () => {
      ignore = true
    }
  }, [period])

  // Still loading if we have nothing yet, or the result is for another period.
  const loading = result?.period !== period
  const orders = loading ? [] : result.orders
  const summary = summariseSales(orders)

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="page-title">Order history</h1>
          <p className="muted">Completed orders and sales</p>
        </div>
        <Link to="/staff" className="button button-secondary">
          Back to dashboard
        </Link>
      </header>

      {/* Period filter: aria-pressed tells screen readers which is selected */}
      <div className="period-filter" role="group" aria-label="Period">
        {PERIODS.map((option) => (
          <button
            key={option.id}
            type="button"
            className="period-button"
            aria-pressed={period === option.id}
            onClick={() => setPeriod(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading && <p className="message">Loading orders…</p>}

      {!loading && result.error && (
        <p className="message error" role="alert">
          Couldn't load order history. Please check the connection and try again.
        </p>
      )}

      {!loading && !result.error && (
        <>
          {/* Summary */}
          <section aria-labelledby="summary-title">
            <h2 id="summary-title" className="sr-only">
              Summary
            </h2>
            <dl className="stats">
              <div className="stat">
                <dt>Orders</dt>
                <dd>{summary.orderCount}</dd>
              </div>
              <div className="stat">
                <dt>Total sales</dt>
                <dd>{formatPrice(summary.totalSales)}</dd>
              </div>
              <div className="stat">
                <dt>Average order</dt>
                <dd>{formatPrice(summary.averageOrder)}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="top-items-title" className="history-panel">
            <h2 id="top-items-title" className="section-title">
              Top items
            </h2>
            {summary.topItems.length === 0 ? (
              <p className="muted">No items sold in this period.</p>
            ) : (
              <ol className="top-items">
                {summary.topItems.map((item) => (
                  <li key={item.name}>
                    <span>{item.name}</span>
                    <span className="muted">{item.quantity} sold</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Order list */}
          <section aria-labelledby="orders-title">
            <h2 id="orders-title" className="section-title">
              Orders <span className="muted">({orders.length})</span>
            </h2>
            {orders.length === 0 ? (
              <p className="muted empty-column">No completed orders in this period.</p>
            ) : (
              <ul className="history-list">
                {orders.map((order) => (
                  <li key={order.id} className="history-order">
                    <div className="history-order-top">
                      <span className="order-card-number">{order.order_number}</span>
                      <span className="history-total">{formatPrice(order.total)}</span>
                    </div>
                    <p className="history-meta">
                      <strong>{order.customer_name}</strong>{' '}
                      <span className="muted">
                        · {dateTimeFormatter.format(new Date(order.created_at))}
                      </span>
                    </p>
                    <p className="history-payment">
                      <span
                        className={`payment-badge ${isPaid(order) ? 'payment-badge-paid' : ''}`}
                      >
                        {staffPaymentLabel(order)}
                      </span>
                    </p>
                    <p className="muted history-items">
                      {order.order_items
                        .map((item) => `${item.quantity} × ${item.menu_items?.name ?? 'Unknown item'}`)
                        .join(', ')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default StaffHistoryPage
