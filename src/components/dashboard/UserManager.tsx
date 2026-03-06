import { useEffect, useState, type FormEvent } from 'react'
import { PlusCircle, Trash2, Pencil, XCircle, Users } from 'lucide-react'
import type { Profile, Role } from '../../types'
import { fetchUsers, createUser, updateUser, deleteUser, type UserPayload } from '../../lib/users'

type Props = {
  profileId?: string | null
}

type FormState = {
  id?: string | null
  email: string
  password: string
  full_name: string
  role: Role
  rut: string
  curso: string
  cargo: string
}

const INITIAL_FORM: FormState = {
  id: null,
  email: '',
  password: '',
  full_name: '',
  role: 'student',
  rut: '',
  curso: '',
  cargo: '',
}

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  teacher: 'Profesor',
  student: 'Alumno',
}

export function UserManager({ profileId }: Props): JSX.Element {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      const data = await fetchUsers()
      setUsers(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No pudimos cargar los usuarios. Revisa tu conexión e intenta nuevamente.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    
    if (!formState.email.trim()) {
      setError('Ingresa un correo electrónico.')
      return
    }

    if (!formState.password.trim()) {
      setError('Ingresa una contraseña.')
      return
    }

    if (!formState.full_name.trim()) {
      setError('Ingresa el nombre completo.')
      return
    }

    setSubmitting(true)
    setError(null)
    setStatusMessage(null)

    try {
      const payload: UserPayload = {
        email: formState.email,
        password: formState.password,
        full_name: formState.full_name,
        role: formState.role,
        rut: formState.rut || undefined,
        curso: formState.curso || undefined,
        cargo: formState.cargo || undefined,
      }

      if (formState.id) {
        // Actualizar usuario existente
        const updatedUser = await updateUser(formState.id, payload)
        setUsers(prev => prev.map(user => user.id === formState.id ? updatedUser : user))
        setStatusMessage('Usuario actualizado correctamente.')
      } else {
        // Crear nuevo usuario
        const newUser = await createUser(payload)
        setUsers(prev => [newUser, ...prev])
        setStatusMessage('Usuario creado correctamente.')
      }

      setFormState(INITIAL_FORM)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ocurrió un error al guardar el usuario. Intenta nuevamente.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  function handleEdit(user: Profile) {
    setFormState({
      id: user.id,
      email: user.email || '',
      password: '********',
      full_name: user.full_name || '',
      role: user.role,
      rut: user.rut || '',
      curso: user.curso || '',
      cargo: user.cargo || '',
    })
    setStatusMessage(null)
    setError(null)
  }

  async function handleDelete(id: string) {
    try {
      await deleteUser(id)
      setUsers(prev => prev.filter(user => user.id !== id))
      setStatusMessage('Usuario eliminado correctamente.')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ocurrió un error al eliminar el usuario. Intenta nuevamente.',
      )
    }
  }

  function resetForm() {
    setFormState(INITIAL_FORM)
    setError(null)
    setStatusMessage(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {statusMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800">{statusMessage}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {formState.id ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo *
              </label>
              <input
                id="full_name"
                type="text"
                value={formState.full_name}
                onChange={(e) => setFormState(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="rut" className="block text-sm font-medium text-gray-700 mb-1">
                RUT
              </label>
              <input
                id="rut"
                type="text"
                value={formState.rut}
                onChange={(e) => setFormState(prev => ({ ...prev, rut: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="12345678-9"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico *
              </label>
              <input
                id="email"
                type="email"
                value={formState.email}
                onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña *
              </label>
              <input
                id="password"
                type="password"
                value={formState.password}
                onChange={(e) => setFormState(prev => ({ ...prev, password: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Cargo *
              </label>
              <select
                id="role"
                value={formState.role}
                onChange={(e) => setFormState(prev => ({ ...prev, role: e.target.value as Role }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="student">Alumno</option>
                <option value="teacher">Profesor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div>
              <label htmlFor="curso" className="block text-sm font-medium text-gray-700 mb-1">
                Curso/Nivel {formState.role === 'student' && '*'}
              </label>
              <input
                id="curso"
                type="text"
                value={formState.curso}
                onChange={(e) => setFormState(prev => ({ ...prev, curso: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 1-C, PK-B, II-D"
                required={formState.role === 'student'}
              />
              <p className="text-xs text-gray-500 mt-1">
                Escribe el curso del estudiante. Ejemplo: "1-C", "PK-B", "III-A"
              </p>
            </div>

            <div>
              <label htmlFor="cargo" className="block text-sm font-medium text-gray-700 mb-1">
                Cargo {formState.role === 'teacher' && '*'}
              </label>
              <input
                id="cargo"
                type="text"
                value={formState.cargo}
                onChange={(e) => setFormState(prev => ({ ...prev, cargo: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Profesor de Matemáticas"
                required={formState.role === 'teacher'}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <PlusCircle className="h-4 w-4" />
              {submitting ? 'Guardando...' : formState.id ? 'Actualizar Usuario' : 'Crear Usuario'}
            </button>
            
            {formState.id && (
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                <XCircle className="h-4 w-4" />
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Usuarios Registrados</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RUT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Correo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cargo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Curso/Nivel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{user.rut || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin'
                        ? 'bg-red-100 text-red-800'
                        : user.role === 'teacher'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{user.curso || user.cargo || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar usuario"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}