import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/authContext'

// Wraps a staff-only page. Shows it only to signed-in staff;
// everyone else is sent to the staff login page.
// Note: this only hides the page. The real protection is RLS in the
// database, which stops non-staff reading or changing orders.
function RequireStaff({ children }) {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <main className="page">
        <p className="message">Checking staff access…</p>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className="page">
        <p className="message error" role="alert">
          We couldn't check your staff access. Please check your connection and
          refresh the page.
        </p>
      </main>
    )
  }

  if (status === 'notStaff') {
    return (
      <Navigate
        to="/staff/login"
        replace
        state={{ message: "This account doesn't have staff access." }}
      />
    )
  }

  if (status === 'signedOut') {
    return <Navigate to="/staff/login" replace />
  }

  return children
}

export default RequireStaff
