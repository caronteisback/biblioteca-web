import { useCallback, useState, type KeyboardEvent } from 'react'
import type { Libro } from '../api/cliente.ts'
import { useApi } from '../api/contexto.ts'
import { useCargar } from '../hooks/useCargar.ts'
import { CargaVista } from './CargaVista.tsx'

export interface EjemplarElegido {
  id: number
  codigo: string
  titulo: string
}

/** Picks a copy in two steps: search a book by title or author, then choose one of its available copies. */
export function SelectorEjemplar({
  valor,
  alElegir,
  alQuitar,
}: {
  valor: EjemplarElegido | null
  alElegir: (ejemplar: EjemplarElegido) => void
  alQuitar: () => void
}) {
  const api = useApi()
  const [texto, setTexto] = useState('')
  const [consulta, setConsulta] = useState<string | null>(null)
  const [libro, setLibro] = useState<Libro | null>(null)

  const cargarLibros = useCallback(
    () => (consulta === null ? Promise.resolve(null) : api.libros.listar({ q: consulta || undefined, size: 5 })),
    [api, consulta],
  )
  const [libros, recargarLibros] = useCargar(cargarLibros)

  const cargarEjemplares = useCallback(
    () => (libro === null ? Promise.resolve(null) : api.ejemplares.listarDeLibro(libro.id, { size: 100 })),
    [api, libro],
  )
  const [ejemplares, recargarEjemplares] = useCargar(cargarEjemplares)

  if (valor) {
    return (
      <div className="elegido">
        <span>
          Ejemplar: <strong>{valor.codigo}</strong> · {valor.titulo}
        </span>
        <button type="button" onClick={alQuitar}>
          Cambiar
        </button>
      </div>
    )
  }

  function alTeclear(evento: KeyboardEvent) {
    if (evento.key === 'Enter') {
      evento.preventDefault()
      buscar()
    }
  }

  function buscar() {
    setLibro(null)
    setConsulta(texto.trim())
  }

  return (
    <fieldset className="selector">
      <legend>Ejemplar</legend>
      <div className="buscador">
        <label>
          Buscar libro por título o autor
          <input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={alTeclear} />
        </label>
        <button type="button" onClick={buscar}>
          Buscar libro
        </button>
      </div>

      {consulta !== null && libro === null && (
        <CargaVista carga={libros} reintentar={recargarLibros}>
          {(lista) =>
            lista === null || lista.items.length === 0 ? (
              <p>Ningún libro coincide.</p>
            ) : (
              <ul className="opciones">
                {lista.items.map((candidato) => (
                  <li key={candidato.id}>
                    <button type="button" onClick={() => setLibro(candidato)}>
                      {candidato.titulo} · {candidato.autor}
                    </button>
                  </li>
                ))}
              </ul>
            )
          }
        </CargaVista>
      )}

      {libro !== null && (
        <>
          <p>
            Ejemplares disponibles de <strong>{libro.titulo}</strong>{' '}
            <button type="button" onClick={() => setLibro(null)}>
              Otro libro
            </button>
          </p>
          <CargaVista carga={ejemplares} reintentar={recargarEjemplares}>
            {(lista) => {
              const libres = lista?.items.filter((ejemplar) => ejemplar.disponible) ?? []
              return libres.length === 0 ? (
                <p>No hay ejemplares disponibles de este libro.</p>
              ) : (
                <ul className="opciones">
                  {libres.map((ejemplar) => (
                    <li key={ejemplar.id}>
                      <button
                        type="button"
                        onClick={() => alElegir({ id: ejemplar.id, codigo: ejemplar.codigo, titulo: libro.titulo })}
                      >
                        {ejemplar.codigo}
                      </button>
                    </li>
                  ))}
                </ul>
              )
            }}
          </CargaVista>
        </>
      )}
    </fieldset>
  )
}
