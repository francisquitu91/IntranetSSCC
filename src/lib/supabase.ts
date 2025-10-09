import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let sessionToken: string | null = null

const customFetch: typeof fetch = async (input, init) => {
  const headers = new Headers(init?.headers ?? {})
  if (sessionToken) {
    headers.set('sb-profile-token', sessionToken)
  }
  return fetch(input, { ...init, headers })
}

let internalClient: SupabaseClient | undefined

if (typeof supabaseUrl === 'string' && typeof supabaseAnonKey === 'string') {
  internalClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: customFetch,
    },
  })
}

export const supabase = internalClient

export function assertSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase client is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }
  return supabase
}

export function setSupabaseSessionToken(token: string | null) {
  sessionToken = token
}

export function getSupabaseSessionToken(): string | null {
  return sessionToken
}
