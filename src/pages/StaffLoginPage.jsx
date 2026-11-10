import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { fetchStaffProfile } from '../lib/staffProfile'
import { useAuth } from '../context/authContext'

function StaffLoginPage() {
  const { status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // RequireStaff can send a message here (e.g. "no staff access").
  const [errorMessage, setErrorMessage] = useState(location.state?.message ?? '')

  // Already signed in as staff? Go straight to the dashboard.
  if (status === 'staff') {
    return <Navigate to="/staff" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setSubmitting(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      console.error(error)
      // Don't say which part was wrong, so we don't reveal which emails exist.
      setErrorMessage('Email or password is incorrect. Please try again.')
      setSubmitting(false)
      return
    }

    // Signed in. Now check this person is actually staff.
    const { profile, error: profileError } = await fetchStaffProfile(data.user.id)

    if (profileError || !profile) {
      await supabase.auth.signOut()
      setErrorMessage(
        profileError
          ? "We couldn't check your staff access. Please try again."
          : "This account doesn't have staff access."
      )
      setSubmitting(false)
      return
    }

    navigate('/staff', { replace: true })
  }

  return (
    <main className="page narrow-page">
      <p className="muted">Mount Brew Café</p>
      <h1 className="page-title">Staff sign in</h1>

      <form className="checkout-form" onSubmit={handleSubmit}>
        <label htmlFor="staff-email">Email</label>
        <input
          id="staff-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
          required
          disabled={submitting}
        />

        <label htmlFor="staff-password">Password</label>
        <input
          id="staff-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          disabled={submitting}
        />

        {errorMessage && (
          <p className="message error" role="alert">
            {errorMessage}
          </p>
        )}

        <button type="submit" className="button button-large" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}

export default StaffLoginPage
