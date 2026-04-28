import { createClient } from '@supabase/supabase-js'

function getSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/+$/, '')
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
  return { url, anonKey }
}

let supabaseClient = null

export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  const { url, anonKey } = getSupabaseConfig()
  if (!url || !anonKey) {
    throw new Error('Supabase Google auth is not configured')
  }

  supabaseClient = createClient(url, anonKey, {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })

  return supabaseClient
}

function readAuthError(searchParams, hashParams) {
  return (
    searchParams.get('error_description') ||
    searchParams.get('error') ||
    hashParams.get('error_description') ||
    hashParams.get('error')
  )
}

function readAccessToken(searchParams, hashParams) {
  return hashParams.get('access_token') || searchParams.get('access_token')
}

function buildAuthResult(accessToken, error) {
  return {
    accessToken,
    error,
  }
}

export function getGoogleRedirectUrl() {
  return `${window.location.origin}/login`
}

export function hasSupabaseGoogleConfig() {
  const { url, anonKey } = getSupabaseConfig()
  return Boolean(url && anonKey)
}

export async function startGoogleSignIn() {
  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getGoogleRedirectUrl(),
    },
  })

  if (error) {
    throw error
  }
}

export async function readSupabaseAuthResult() {
  const searchParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const error = readAuthError(searchParams, hashParams)

  if (error) {
    return buildAuthResult(null, error)
  }

  const accessToken = readAccessToken(searchParams, hashParams)
  if (accessToken) {
    return buildAuthResult(accessToken, null)
  }

  const code = searchParams.get('code')
  if (!code) {
    return buildAuthResult(null, null)
  }

  try {
    const supabase = getSupabaseClient()
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      return buildAuthResult(null, sessionError.message || 'Unable to read Supabase session')
    }

    if (!session?.access_token) {
      return buildAuthResult(null, 'Unable to create Supabase session')
    }

    return buildAuthResult(session.access_token, null)
  } catch (sessionError) {
    const errorMessage = sessionError instanceof Error ? sessionError.message : 'Unable to read Supabase session'
    return buildAuthResult(null, errorMessage)
  }
}

export function clearSupabaseAuthResult() {
  window.history.replaceState({}, document.title, window.location.pathname)
}
