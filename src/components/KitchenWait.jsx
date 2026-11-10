import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { formatWait } from '../lib/formatWait'

const REFRESH_INTERVAL_MS = 60000 // refresh every 60 seconds

// A small line showing how busy the kitchen is right now, e.g.
// "Kitchen queue: about 8 min" or "No wait right now".
// The database works out the queue time from active orders and prep times.
function KitchenWait() {
  const [queueMinutes, setQueueMinutes] = useState(null) // null = not loaded

  useEffect(() => {
    let ignore = false

    async function loadWait() {
      const { data, error } = await supabase.rpc('get_kitchen_wait')
      if (ignore) return
      if (error) {
        // Not essential, so just log it and keep the last value (or hide).
        console.error(error)
        return
      }
      setQueueMinutes(data.queue_minutes)
    }

    loadWait()
    const intervalId = setInterval(loadWait, REFRESH_INTERVAL_MS)

    return () => {
      ignore = true
      clearInterval(intervalId)
    }
  }, [])

  if (queueMinutes === null) return null

  return (
    <p className="kitchen-wait">
      <span className="kitchen-wait-dot" aria-hidden="true" />
      {queueMinutes > 0 ? `Kitchen queue: ${formatWait(queueMinutes)}` : 'No wait right now'}
    </p>
  )
}

export default KitchenWait
