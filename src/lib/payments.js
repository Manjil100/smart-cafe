import { supabase } from './supabaseClient'

// When an edge function fails, invoke() gives a generic error and the
// function's own message is inside error.context (the HTTP response).
// This reads that message so we can show something useful.
export async function readFunctionError(error) {
  try {
    const body = await error?.context?.json()
    if (body?.error) return body.error
  } catch {
    // The response wasn't JSON; fall back to the generic message below.
  }
  return 'Something went wrong with online payment.'
}

// Ask our edge function for a Stripe Checkout page for this order,
// then send the browser there. Returns { error } if it couldn't start.
// (Stripe is in test mode, so no real money is taken.)
export async function startCardCheckout(orderId) {
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { order_id: orderId },
  })

  if (error || !data?.url) {
    console.error(error ?? 'No checkout URL returned')
    return { error: await readFunctionError(error) }
  }

  window.location.assign(data.url) // leave our site for Stripe's page
  return { error: null }
}

// Ask our edge function to check with Stripe whether this order is paid.
// It updates the order in the database; we just reload afterwards.
export async function verifyCardPayment(orderId) {
  const { error } = await supabase.functions.invoke('verify-checkout', {
    body: { order_id: orderId },
  })
  if (error) console.error(await readFunctionError(error))
}

export function isPaid(order) {
  return order.payment_status === 'paid'
}

// Wording for customers on the tracking page.
export function customerPaymentLabel(order) {
  if (isPaid(order)) return 'Paid'
  if (order.payment_method === 'card') return 'Awaiting online payment'
  return 'Pay at the counter'
}

// Short wording for staff, e.g. "Paid · card" or "Unpaid · counter".
export function staffPaymentLabel(order) {
  const method = order.payment_method === 'card' ? 'card' : 'counter'
  return `${isPaid(order) ? 'Paid' : 'Unpaid'} · ${method}`
}
