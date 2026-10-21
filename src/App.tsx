import { useEffect, useState } from 'react'
import { API_URL } from './config.ts'

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'listo'; libros: number }
  | { tipo: 'error'; detalle: string }

async function leer<T>(ruta: string): Promise<T> {
  const respuesta = await fetch(`${API_URL}${ruta}`)
  if (!respuesta.ok) {
    throw new Error(`${ruta} respondió ${respuesta.status}`)
  }
  return respuesta.json() as Promise<T>
}

function App() {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })

  useEffect(() => {
    let vigente = true
    leer<{ totalElements: number }>('/api/v1/libros?size=1')
      .then((catalogo) => {
        if (!vigente) return
        setEstado({ tipo: 'listo', libros: catalogo.totalElements })
      })
      .catch((error: unknown) => {
        if (!vigente) return
        setEstado({ tipo: 'error', detalle: error instanceof Error ? error.message : 'error desconocido' })
      })
    return () => {
      vigente = false
    }
  }, [])

  return (
    <main>
      <h1>Biblioteca</h1>
      <p className="lead">Panel del bibliotecario</p>

      <section aria-live="polite" className={`estado estado-${estado.tipo}`}>
        {estado.tipo === 'cargando' && <p>Conectando con la API…</p>}
        {estado.tipo === 'listo' && (
          <>
            <p className="titulo">API conectada</p>
            <p>
              Libros en el catálogo: <strong>{estado.libros}</strong>
            </p>
          </>
        )}
        {estado.tipo === 'error' && (
          <>
            <p className="titulo">No se pudo conectar con la API</p>
            <p>
              Comprueba que está en marcha en <code>{API_URL}</code>.
            </p>
            <p className="detalle">{estado.detalle}</p>
          </>
        )}
      </section>
    </main>
  )
}

export default App
