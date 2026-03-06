import { useState } from 'react'
import { Upload, FileSpreadsheet, Users, Briefcase, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { createBulkUsers } from '../../lib/bulkUsers'

type UploadType = 'students' | 'workers' | null

type ProcessResult = {
  success: number
  failed: number
  errors: string[]
}

export function NominaUploader(): JSX.Element {
  const [uploadType, setUploadType] = useState<UploadType>(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<ProcessResult | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: UploadType) => {
    const file = event.target.files?.[0]
    if (!file) return

    setProcessing(true)
    setResult(null)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      
      // Leer con { header: 1 } para obtener arrays en lugar de objetos
      const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][]
      
      console.log('Primeras 3 filas del Excel:', rawData.slice(0, 3))
      
      // Detectar la fila de headers (buscar la que tiene "Rut" o "Nombre")
      let headerRow = -1
      for (let i = 0; i < Math.min(5, rawData.length); i++) {
        const row = rawData[i]
        if (row.some((cell: any) => 
          typeof cell === 'string' && (
            cell.toLowerCase().includes('rut') || 
            cell.toLowerCase().includes('nombre') ||
            cell.toLowerCase().includes('alumno')
          )
        )) {
          headerRow = i
          break
        }
      }
      
      if (headerRow === -1) {
        throw new Error('No se encontraron los headers (Rut, Nombre, etc.) en el Excel')
      }
      
      console.log('Headers encontrados en fila:', headerRow + 1, rawData[headerRow])
      
      // Convertir a JSON usando los headers correctos
      const headers = rawData[headerRow].map((h: any) => String(h).trim())
      const jsonData = rawData.slice(headerRow + 1)
        .filter(row => row.some(cell => cell !== '')) // Filtrar filas vacías
        .map(row => {
          const obj: any = {}
          headers.forEach((header, index) => {
            if (header && row[index] !== undefined && row[index] !== '') {
              obj[header] = row[index]
            }
          })
          return obj
        })

      console.log('Datos procesados:', jsonData.slice(0, 2))

      // Procesar según el tipo
      const processResult = await createBulkUsers(jsonData, type!)
      setResult(processResult)
    } catch (error) {
      console.error('Error procesando archivo:', error)
      setResult({
        success: 0,
        failed: 1,
        errors: [error instanceof Error ? error.message : 'Error desconocido procesando archivo']
      })
    } finally {
      setProcessing(false)
      // Limpiar el input
      event.target.value = ''
    }
  }

  if (!uploadType) {
    return (
      <div className="rounded-3xl bg-white p-8 shadow-card">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Carga Masiva de Nóminas</h2>
          <p className="text-sm text-slate-600">
            Sube archivos Excel con nóminas de estudiantes o trabajadores para crear usuarios automáticamente.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Opción Estudiantes */}
          <button
            type="button"
            onClick={() => setUploadType('students')}
            className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-slate-200 p-8 text-center transition hover:border-blue-500 hover:bg-blue-50"
          >
            <div className="rounded-full bg-blue-100 p-6 group-hover:bg-blue-200">
              <Users className="h-10 w-10 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Nómina de Estudiantes</h3>
              <p className="text-sm text-slate-500">
                Formato: Curso, Alumnos, Genero, Rut, Email Alumno
              </p>
            </div>
          </button>

          {/* Opción Trabajadores */}
          <button
            type="button"
            onClick={() => setUploadType('workers')}
            className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-slate-200 p-8 text-center transition hover:border-emerald-500 hover:bg-emerald-50"
          >
            <div className="rounded-full bg-emerald-100 p-6 group-hover:bg-emerald-200">
              <Briefcase className="h-10 w-10 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Nómina de Trabajadores</h3>
              <p className="text-sm text-slate-500">
                Formato: Rut, Nombre, Correo electrónico, Cargo, Estamentos
              </p>
            </div>
          </button>
        </div>

        {/* Información adicional */}
        <div className="mt-6 rounded-xl bg-amber-50 p-4 border border-amber-200">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Importante:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>El RUT será usado como nombre de usuario para ingresar</li>
                <li>La contraseña será los últimos 4 dígitos antes del dígito verificador</li>
                <li>Los usuarios existentes no serán duplicados</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-3xl bg-white p-8 shadow-card">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => {
            setUploadType(null)
            setResult(null)
          }}
          className="text-sm text-blue-600 hover:text-blue-700 mb-4"
        >
          ← Volver
        </button>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Subir Nómina de {uploadType === 'students' ? 'Estudiantes' : 'Trabajadores'}
        </h2>
        <p className="text-sm text-slate-600">
          Selecciona el archivo Excel con la nómina para procesarlo.
        </p>
      </div>

      {/* Área de carga */}
      <div className="mb-6">
        <label
          htmlFor="file-upload"
          className={`flex flex-col items-center justify-center w-full h-64 rounded-2xl border-2 border-dashed cursor-pointer transition ${
            processing
              ? 'border-slate-300 bg-slate-50 cursor-not-allowed'
              : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
          }`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {processing ? (
              <>
                <Loader2 className="h-12 w-12 text-blue-500 mb-4 animate-spin" />
                <p className="text-sm text-slate-600 font-medium">Procesando archivo...</p>
                <p className="text-xs text-slate-500 mt-1">Esto puede tomar varios segundos</p>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-slate-400 mb-4" />
                <p className="mb-2 text-sm text-slate-600">
                  <span className="font-semibold">Click para subir</span> o arrastra el archivo
                </p>
                <p className="text-xs text-slate-500">Archivos Excel (.xlsx, .xls)</p>
              </>
            )}
          </div>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".xlsx,.xls"
            onChange={(e) => handleFileUpload(e, uploadType)}
            disabled={processing}
          />
        </label>
      </div>

      {/* Resultado */}
      {result && (
        <div className={`rounded-xl p-6 ${result.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
          <div className="flex items-start gap-3">
            {result.failed === 0 ? (
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3 className={`font-semibold mb-2 ${result.failed === 0 ? 'text-green-900' : 'text-amber-900'}`}>
                Procesamiento completado
              </h3>
              <div className="text-sm space-y-1 mb-3">
                <p className="text-green-700">✓ {result.success} usuarios creados exitosamente</p>
                {result.failed > 0 && (
                  <p className="text-amber-700">✗ {result.failed} usuarios con errores</p>
                )}
              </div>

              {result.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-amber-900 mb-2">Errores encontrados:</p>
                  <div className="max-h-40 overflow-y-auto bg-white rounded-lg p-3 border border-amber-200">
                    {result.errors.map((error, index) => (
                      <p key={index} className="text-xs text-amber-800 mb-1">• {error}</p>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setResult(null)}
                className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Subir otro archivo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formato esperado */}
      <div className="mt-6 rounded-xl bg-slate-50 p-4">
        <div className="flex items-start gap-2">
          <FileSpreadsheet className="h-5 w-5 text-slate-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-600">
            <p className="font-medium mb-2">Formato esperado del Excel:</p>
            {uploadType === 'students' ? (
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>Curso:</strong> Ej: "I-A", "8-B", "IV-C"</li>
                <li><strong>Alumnos:</strong> Nombre completo del estudiante</li>
                <li><strong>Genero:</strong> M o F</li>
                <li><strong>Rut:</strong> Con o sin puntos, con guión (ej: "12345678-9" o "24155919K")</li>
                <li><strong>Email Alumno:</strong> Correo institucional</li>
              </ul>
            ) : (
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>Rut:</strong> Con o sin formato (ej: "16211999-0")</li>
                <li><strong>Nombre:</strong> Nombre completo del trabajador</li>
                <li><strong>Correo electrónico:</strong> Email institucional</li>
                <li><strong>Cargo:</strong> Puesto del trabajador</li>
                <li><strong>Estamentos:</strong> Docentes, Paradocentes, Auxiliares, Administrativos</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
