import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { fetchStaffProfile } from '../lib/staffProfile'
import { AuthContext } from './authContext'

// Keeps track of the signed-in user and whether they are staff.
//
// status is one of:
//   'loading'   still checking
//   'signedOut' nobody is signed in
//   'notStaff'  signed in, but no staff_profiles row
//   'error'     couldn't check staff access (e.g. offline)
//   'staff'     signed in staff member
function AuthProvider({ children }) {
  // undefined = not checked yet, null = signed out
  const [session, setSession] = useState(undefined)
  // The staff check result, remembered together with the user it was for.
  const [profileResult, setProfileResult] = useState(null)

  // 1. Find the current session, then listen for sign-in / sign-out.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Only store the session here. Supabase advises not to call other
      // Supabase functions inside this callback; effect 2 does that instead.
      setSession(newSession)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  // 2. Whenever a different user signs in, check if they are staff.
  const userId = session?.user?.id
  useEffect(() => {
    if (!userId) return
    let ignore = false

    fetchStaffProfile(userId).then((result) => {
      if (!ignore) setProfileResult({ userId, ...result })
    })

    return () => {
      ignore = true
    }
  }, [userId])

  // Work out the status from the two pieces of state above.
  let status
  if (session === undefined) status = 'loading'
  else if (!session) status = 'signedOut'
  else if (profileResult?.userId !== userId) status = 'loading' // check not finished
  else if (profileResult.error) status = 'error'
  else if (profileResult.profile) status = 'staff'
  else status = 'notStaff'

  const value = {
    status,
    session,
    staff: status === 'staff' ? profileResult.profile : null,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
