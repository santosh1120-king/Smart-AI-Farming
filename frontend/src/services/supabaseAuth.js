function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/+$/, '')
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
  return { url, anonKey }
}

export function getGoogleRedirectUrl() {
  return `${window.location.origin}/login`
}

export function hasSupabaseGoogleConfig() {
  const { url, anonKey } = getSupabaseConfig()
  return Boolean(url && anonKey)
}

export function startGoogleSignIn() {
  const { url, anonKey } = getSupabaseConfig()
  if (!url || !anonKey) {
    throw new Error('Supabase Google auth is not configured')
  }

  const authUrl = new URL(`${url}/auth/v1/authorize`)
  authUrl.searchParams.set('provider', 'google')
  authUrl.searchParams.set('redirect_to', getGoogleRedirectUrl())
  authUrl.searchParams.set('apikey', anonKey)

  window.location.assign(authUrl.toString())
}

export function readSupabaseAuthResult() {
  const searchParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))

  const error =
    searchParams.get('error_description') ||
    searchParams.get('error') ||
    hashParams.get('error_description') ||
    hashParams.get('error')

  const accessToken = hashParams.get('access_token') || searchParams.get('access_token')

  return {
    accessToken,
    error,
  }
}

export function clearSupabaseAuthResult() {
  window.history.replaceState({}, document.title, window.location.pathname)
}
