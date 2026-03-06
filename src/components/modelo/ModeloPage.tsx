import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { getModeloIslandes, type ModeloIslandes } from '../../lib/modeloIslandes'

const TEXTO_MODELO = `En el Colegio SS.CC. Manquehue impulsamos el Modelo Islandés de prevención, una estrategia internacional basada en evidencia que busca promover el bienestar integral de niños, niñas y adolescentes, fortaleciendo los factores protectores en su entorno familiar, escolar y comunitario.

Esta iniciativa, desarrollada originalmente en Islandia a fines de los años noventa y hoy aplicada en distintos países, es promovida en nuestra comuna por la Municipalidad de Vitacura, que lidera su implementación en diversos establecimientos educacionales del sector.

El modelo propone una mirada preventiva que va más allá de las campañas informativas sobre consumo de alcohol y drogas. Su foco está en fortalecer la vida familiar, fomentar la participación en actividades deportivas, culturales y recreativas, y promover una comunidad educativa activa en el acompañamiento de los estudiantes.

En nuestro colegio, la implementación de este enfoque se traduce en un trabajo conjunto entre familias, educadores y estudiantes, promoviendo espacios de diálogo, hábitos saludables y un uso positivo del tiempo libre. De esta manera, buscamos seguir construyendo una comunidad educativa que cuide, acompañe y favorezca el desarrollo integral de cada uno de nuestros alumnos.`

export function ModeloPage(): JSX.Element {
  const [modelo, setModelo] = useState<ModeloIslandes | null>(null)
  const [loading, setLoading] = useState(true)
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  // Cargar datos del modelo islandés
  useEffect(() => {
    async function load() {
      try {
        const data = await getModeloIslandes()
        setModelo(data)
      } catch (err) {
        console.error('Error loading modelo islandes:', err)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  // Efecto máquina de escribir
  useEffect(() => {
    if (currentIndex < TEXTO_MODELO.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + TEXTO_MODELO[currentIndex])
        setCurrentIndex((prev) => prev + 1)
      }, 20) // Velocidad de escritura (ms por carácter)

      return () => clearTimeout(timeout)
    }
  }, [currentIndex])

  if (loading) {
    return (
      <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-8 shadow-sm">
        <p className="text-center text-slate-600">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Título */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-brand-blue text-white">
          <Users className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Modelo Islandés</h1>
      </div>

      {/* Foto principal del grupo directivo */}
      {modelo?.main_photo_url && (
        <div className="overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-sm">
          <img
            src={modelo.main_photo_url}
            alt="Grupo Directivo Modelo Islandés"
            className="h-[250px] sm:h-[350px] lg:h-[400px] w-full object-cover"
          />
        </div>
      )}

      {/* Equipo / Encargados */}
      {modelo?.team_members && modelo.team_members.length > 0 && (
        <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="mb-3 sm:mb-4 text-lg sm:text-xl font-semibold text-slate-900">Equipo</h2>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {modelo.team_members.map((member, index) => (
              <div
                key={index}
                className="rounded-full bg-brand-light px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-700"
              >
                {member}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Texto con efecto máquina de escribir */}
      <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 lg:p-8 shadow-sm">
        <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed text-slate-700">
          {displayedText}
          {currentIndex < TEXTO_MODELO.length && (
            <span className="inline-block h-4 sm:h-5 w-0.5 animate-pulse bg-brand-blue" />
          )}
        </p>
      </div>
    </div>
  )
}
