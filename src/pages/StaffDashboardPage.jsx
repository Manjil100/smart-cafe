import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatPrice } from '../lib/formatPrice'
import { useAuth } from '../context/authContext'

// The three columns, and the one action that moves an order forward.
const COLUMNS = [
  { status: 'pending', title: 'Pending', nextStatus: 'preparing', action: 'Start preparing' },
  { status: 'preparing', title: 'Preparing', nextStatus: 'ready', action: 'Mark ready' },
  { status: 'ready', title: 'Ready', nextStatus: 'completed', action: 'Complete' },
]

const REFRESH_INTERVAL_MS = 30000 // backup refresh every 30 seconds

// e.g. "Just now", "4 min ago", "1 h 12 min ago"
function timeSince(createdAt, now) {
  const minutes = Math.floor((now - new Date(createdAt).getTime()) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min ago`
}

function StaffDashboardPage() {
  const { staff } = useAuth()

  const [orders, setOrders] = useState([])
  const [loadState, setLoadState] = useState('loading') // 'loading' | 'ready' | 'error'
  const [now, setNow] = useState(() => Date.now()) // used for "4 min ago"
  const [savingIds, setSavingIds] = useState([]) // orders currently being updated
  const [cardErrors, setCardErrors] = useState({}) // { orderId: message }

  // Load all orders that aren't completed, oldest first (newest last).
  const loadOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(
        'id, order_number, customer_name, status, total, created_at, order_items(quantity, unit_price, menu_items(name))'
      )
      .neq('status', 'completed')
      .order('created_at', { ascending: true })

    setNow(Date.now())

    if (error) {
      console.error(error)
      setLoadState('error') // keep showing the last list we had
      return
    }
    setOrders(data)
    setLoadState('ready')
  }, [])

  // Effect 1: first load + live updates whenever an order is added or changed.
  useEffect(() => {
    // The linter can't tell that loadOrders only sets state after an `await`
    // (i.e. not synchronously), so this warning is a false positive here.
    // eslint-disable-next-line react/set-state-in-effect
    loadOrders()

    const channel = supabase
      .channel('staff-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, loadOrders)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, loadOrders)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadOrders])

  // Effect 2: backup refresh every 30 seconds (also keeps "min ago" fresh).
  useEffect(() => {
    const intervalId = setInterval(loadOrders, REFRESH_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [loadOrders])

  // Move one order to its next status.
  async function advanceOrder(order, nextStatus) {
    setSavingIds((current) => [...current, order.id])
    setCardErrors((current) => ({ ...current, [order.id]: undefined }))

    // .select('id') returns the updated rows. If RLS blocks the update,
    // Supabase doesn't return an error; it just updates 0 rows, so we check.
    const { data, error } = await supabase
      .from('orders')
      .update({ status: nextStatus })
      .eq('id', order.id)
      .select('id')

    if (error || data.length === 0) {
      console.error(error ?? 'No rows updated')
      setCardErrors((current) => ({
        ...current,
        [order.id]: `Couldn't update order ${order.order_number}. Please try again.`,
      }))
    } else {
      await loadOrders() // show the change straight away
    }

    setSavingIds((current) => current.filter((id) => id !== order.id))
  }

  async function handleSignOut() {
    await supabase.auth.signOut() // RequireStaff then sends us to the login page
  }

  const countFor = (status) => orders.filter((order) => order.status === status).length

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="muted">Signed in as {staff.name}</p>
        </div>
        <button type="button" className="button button-secondary" onClick={handleSignOut}>
          Sign out
        </button>
      </header>

      {/* Read out to screen reader users when the counts change */}
      <p className="sr-only" aria-live="polite">
        {loadState === 'ready' &&
          `${countFor('pending')} pending, ${countFor('preparing')} preparing, ${countFor('ready')} ready.`}
      </p>

      {loadState === 'loading' && <p className="message">Loading orders…</p>}

      {loadState === 'error' && (
        <p className="message error" role="alert">
          Couldn't load the latest orders. Retrying automatically. Check the
          connection if this keeps showing.
        </p>
      )}

      {loadState !== 'loading' && (
        <div className="dashboard-columns">
          {COLUMNS.map((column) => {
            const columnOrders = orders.filter((order) => order.status === column.status)

            return (
              <section
                key={column.status}
                className="dashboard-column"
                aria-labelledby={`column-${column.status}`}
              >
                <h2 id={`column-${column.status}`} className="section-title">
                  {column.title} <span className="muted">({columnOrders.length})</span>
                </h2>

                {columnOrders.length === 0 && (
                  <p className="muted empty-column">No orders</p>
                )}

                <ul className="order-cards">
                  {columnOrders.map((order) => {
                    const saving = savingIds.includes(order.id)
                    const errorMessage = cardErrors[order.id]

                    return (
                      <li key={order.id} className="order-card">
                        <div className="order-card-top">
                          <span className="order-card-number">{order.order_number}</span>
                          <span className="muted">{timeSince(order.created_at, now)}</span>
                        </div>
                        <p className="order-card-name">{order.customer_name}</p>

                        <ul className="order-card-items">
                          {order.order_items.map((item, index) => (
                            <li key={index}>
                              <strong>{item.quantity} ×</strong>{' '}
                              {item.menu_items?.name ?? 'Unknown item'}
                            </li>
                          ))}
                        </ul>

                        <p className="order-card-total">
                          Total <strong>{formatPrice(order.total)}</strong>
                        </p>

                        {errorMessage && (
                          <p className="message error" role="alert">
                            {errorMessage}
                          </p>
                        )}

                        <button
                          type="button"
                          className="button button-large"
                          onClick={() => advanceOrder(order, column.nextStatus)}
                          disabled={saving}
                        >
                          {saving ? 'Saving…' : column.action}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default StaffDashboardPage
