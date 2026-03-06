import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase as supabaseClient, setSupabaseSessionToken, getSupabaseSessionToken } from '../lib/supabase'
import type { Profile, Role } from '../types'

export type AuthContextValue = {
  profile: Profile | null
  role: Role | null
  token: string | null
  loading: boolean
  error?: string
  signIn: (params: { email: string; password: string }) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>(undefined)

  const TOKEN_STORAGE_KEY = 'sscc_profile_token'

  if (!supabaseClient) {
    return (
      <AuthContext.Provider
        value={{
          profile: null,
          role: null,
          token: null,
          loading: false,
          error: 'Supabase no está configurado. Revisa tu archivo .env y reinicia la aplicación.',
          signIn: async () => {
            throw new Error('Supabase no está configurado. No es posible iniciar sesión.')
          },
          signOut: async () => {
            throw new Error('Supabase no está configurado.')
          },
          refreshProfile: async () => {
            throw new Error('Supabase no está configurado.')
          },
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }

  const supabase = supabaseClient

  useEffect(() => {
    let isMounted = true

    async function bootstrap() {
      try {
  const storedToken = typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_STORAGE_KEY) : null
        if (!isMounted) return

        if (storedToken) {
          try {
            await loadProfileByToken(storedToken)
            if (isMounted) {
              setToken(storedToken)
              setSupabaseSessionToken(storedToken)
            }
          } catch (profileError) {
            console.error(profileError)
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem(TOKEN_STORAGE_KEY)
            }
            setSupabaseSessionToken(null)
            setToken(null)
            setProfile(null)
          }
        }
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar la sesión')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void bootstrap()

    return () => {
      isMounted = false
    }
  }, [supabase])

  async function loadProfileByToken(activeToken: string) {
    try {
        // Simple approach: just verify profile exists with stored email/password
        const storedProfile = JSON.parse(activeToken)
        const { data, error: rpcError } = await supabase.rpc('simple_login', {
          p_email: storedProfile.email,
          p_password: storedProfile.password,
        })

        if (rpcError) {
        throw rpcError
      }

      const record = Array.isArray(data) ? data[0] : data

      if (record) {
        const normalizedRole = (record.role ?? 'student') as Role
        setProfile({
          ...record,
          id: String(record.id),
          role: normalizedRole,
          rut: record.rut,
          curso: record.curso,
          cargo: record.cargo,
        })
      } else {
        setProfile(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos obtener el perfil del usuario')
      setProfile(null)
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      role: profile?.role ?? null,
      token,
      loading,
      error,
      signIn: async ({ email, password }) => {
        setLoading(true)
        setError(undefined)
        const { data, error: rpcError } = await supabase.rpc('simple_login', {
          p_email: email,
          p_password: password,
        })

        if (rpcError) {
          setError(rpcError.message)
          setLoading(false)
          throw rpcError
        }

        const record = (Array.isArray(data) ? data[0] : data) as any | null

        if (!record?.id) {
          const err = new Error('No pudimos iniciar sesión. Intenta nuevamente.')
          setError(err.message)
          setLoading(false)
          throw err
        }

        // Store credentials as simple JSON token
        const simpleToken = JSON.stringify({ email, password })
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(TOKEN_STORAGE_KEY, simpleToken)
        }
        setSupabaseSessionToken(null) // No longer using Supabase tokens
        setToken(simpleToken)

        setProfile({
          id: record.id,
          full_name: record.full_name,
          role: (record.role ?? 'student') as Role,
          email: record.email,
          rut: record.rut,
          curso: record.curso,
          cargo: record.cargo,
        })
        setLoading(false)
      },
      signOut: async () => {
        setLoading(true)
        // Simple logout - just clear local storage
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(TOKEN_STORAGE_KEY)
        }
        setSupabaseSessionToken(null)
        setToken(null)
        setProfile(null)
        setError(undefined)
        setLoading(false)
      },
      refreshProfile: async () => {
        const activeToken = token
        if (activeToken) {
          await loadProfileByToken(activeToken)
        }
      },
    }),
    [profile, loading, error, supabase, token],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider')
  }
  return ctx
}
