import { useState, useEffect, type FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { BookOpen, GraduationCap, ShieldCheck } from 'lucide-react'
import { getSystemSetting } from '../../lib/systemSettings'

type UserType = 'admin' | 'teacher' | 'student' | null

export function LoginForm(): JSX.Element {
  const { signIn, loading, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<UserType>(null)
  const [logoUrl, setLogoUrl] = useState<string>('https://ssccmanquehue.cl/wp-content/uploads/2025/03/70SSCC_OK_transparente-4-1-1-1.png')

  useEffect(() => {
    async function loadLogo() {
      const url = await getSystemSetting('logo_url')
      if (url) setLogoUrl(url)
    }
    void loadLogo()
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalError(null)

    if (!email || !password) {
      setLocalError('Ingresa tu correo y contraseña institucional.')
      return
    }

    try {
      await signIn({ email, password })
    } catch (err) {
      if (err instanceof Error) {
        setLocalError(err.message)
      } else {
        setLocalError('No pudimos iniciar sesión. Intenta nuevamente.')
      }
    }
  }

  function handleQuickAccess(type: UserType, quickEmail: string, quickPassword: string) {
    setSelectedType(type)
    setEmail(quickEmail)
    setPassword(quickPassword)
  }

  if (!selectedType) {
    return (
      <div className="mx-auto w-full max-w-lg space-y-6 rounded-3xl bg-white p-8 shadow-card">
        {/* Logo y Header */}
        <header className="space-y-4 text-center">
          <div className="flex justify-center">
            <img
              src={logoUrl}
              alt="Logo Colegio SSCC"
              className="h-20 w-20 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Intranet SSCC</h1>
          <p className="text-sm text-slate-500">Selecciona tu tipo de acceso</p>
        </header>

        {/* Opciones de acceso */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Profesores */}
          <button
            type="button"
            onClick={() => handleQuickAccess('teacher', '', '')}
            className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-slate-200 p-6 text-center transition hover:border-amber-600 hover:bg-amber-50"
          >
            <div className="rounded-full bg-amber-100 p-4 group-hover:bg-amber-200">
              <BookOpen className="h-8 w-8 text-amber-700" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Profesores</h3>
              <p className="text-sm text-slate-500">Acceso a gestión de contenidos</p>
            </div>
          </button>

          {/* Alumnos */}
          <button
            type="button"
            onClick={() => handleQuickAccess('student', '', '')}
            className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-slate-200 p-6 text-center transition hover:border-green-500 hover:bg-green-50"
          >
            <div className="rounded-full bg-green-100 p-4 group-hover:bg-green-200">
              <GraduationCap className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Alumnos</h3>
              <p className="text-sm text-slate-500">Acceso a noticias y contenidos</p>
            </div>
          </button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setSelectedType('admin')}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 underline"
          >
            <ShieldCheck className="h-4 w-4" />
            Acceso administrador
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-6 rounded-3xl bg-white p-8 shadow-card">
      {/* Header con logo */}
      <header className="space-y-4 text-center">
        <div className="flex justify-center">
          <img
            src={logoUrl}
            alt="Logo Colegio SSCC"
            className="h-16 w-16 object-contain"
          />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">Intranet SSCC</h1>
        <p className="text-sm text-slate-500">
          Acceso como {selectedType === 'admin' ? 'Administrador' : selectedType === 'teacher' ? 'Profesor' : 'Alumno'}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-600" htmlFor="email">
            RUT o Correo electrónico
          </label>
          <input
            id="email"
            type="text"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            placeholder="12345678-9 o nombre@sscc.cl"
            autoComplete="username"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-600" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        {(localError || error) && (
          <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">
            {localError ?? error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-sky-900 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? 'Ingresando…' : 'Iniciar sesión'}
        </button>
      </form>

      {/* Botón para volver */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            setSelectedType(null)
            setEmail('')
            setPassword('')
            setLocalError(null)
          }}
          className="text-sm text-slate-500 hover:text-slate-700 underline"
        >
          ← Volver a selección de acceso
        </button>
      </div>
    </div>
  )
}
