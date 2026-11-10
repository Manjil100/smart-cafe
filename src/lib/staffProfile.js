import { supabase } from './supabaseClient'

// Looks up the staff_profiles row for a signed-in user.
// RLS only lets a user read their own row, so this returns:
//   { profile: { id, name } }  -> they are staff
//   { profile: null }          -> signed in, but not staff
//   { error }                  -> the check itself failed (e.g. no connection)
export async function fetchStaffProfile(userId) {
  const { data, error } = await supabase
    .from('staff_profiles')
    .select('id, name')
    .eq('id', userId)
    .maybeSingle() // one row or null, instead of a list

  if (error) {
    console.error(error)
    return { profile: null, error }
  }
  return { profile: data, error: null }
}
