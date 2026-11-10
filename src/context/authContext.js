import { createContext, useContext } from 'react'

// Filled by AuthProvider with { status, session, staff }.
export const AuthContext = createContext(null)

// Any component can call useAuth() to find out who is signed in.
export function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return auth
}
