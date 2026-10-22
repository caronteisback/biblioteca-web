import { useCallback, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useApi } from '../api/contexto.ts'
import type { Ejemplar } from '../api/cliente.ts'
import { useCargar } from '../hooks/useCargar.ts'
import { useSesion } from '../sesion/useSesion.ts'
import { estadoDelEjemplar } from '../formato.ts'
import { AvisoError } from './AvisoError.tsx'
import { CargaVista } from './CargaVista.tsx'
import { Estado, type Tono } from './Estado.tsx'

const MAXIMO = 100

const TONO_DEL_EJEMPLAR: Record<string, Tono> = { Disponible: 'ok', Prestado: 'aviso', 'De baja': 'neutro' }

/** The copies of one book, with the commands to add, retire, restore and delete them. */
export function EjemplaresDelLibro({ libroId }: { libroId: number }) {
  const api = useApi()
  const puedeGestionar = useSesion().rol === 'LIBRARIAN'
  const cargar = useCallback(() => api.ejemplares.listarDeLibro(libroId, { size: MAXIMO }), [api, libroId])
  const [carga, recargar] = useCargar(cargar)
  const [codigo, setCodigo] = useState('')
  const [errorAccion, setErrorAccion] = useState<unknown>(null)

  async function ejecutar(accion: () => Promise<unknown>): Promise<boolean> {
    setErrorAccion(null)
    try {
      await accion()
      recargar()
      return true
    } catch (error) {
      setErrorAccion(error)
      return false
    }
  }

  async function agregar(evento: FormEvent) {
    evento.preventDefault()
    if (await ejecutar(() => api.ejemplares.crear(libroId, codigo.trim()))) {
      setCodigo('')
    }
  }

  function eliminar(ejemplar: Ejemplar) {
    if (window.confirm(`¿Eliminar el ejemplar ${ejemplar.codigo}?`)) {
      void ejecutar(() => api.ejemplares.eliminar(ejemplar.id))
    }
  }

  return (
    <section aria-labelledby="titulo-ejemplares">
      <h2 id="titulo-ejemplares">Ejemplares</h2>
      <CargaVista carga={carga} reintentar={recargar}>
        {(lista) => (
          <>
            {lista.items.length === 0 ? (
              <p>Este libro todavía no tiene ejemplares. Sin ejemplares no se puede prestar.</p>
            ) : (
              <div className="tabla-scroll">
                <table className="apilable" role="table">
                  <thead role="rowgroup">
                    <tr role="row">
                      <th scope="col" role="columnheader">Código</th>
                      <th scope="col" role="columnheader">Estado</th>
                      {puedeGestionar && <th scope="col" role="columnheader">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody role="rowgroup">
                    {lista.items.map((ejemplar) => (
                      <tr role="row" key={ejemplar.id}>
                        <td role="cell" data-label="Código">{ejemplar.codigo}</td>
                        <td role="cell" data-label="Estado">
                          <Estado tono={TONO_DEL_EJEMPLAR[estadoDelEjemplar(ejemplar)]}>{estadoDelEjemplar(ejemplar)}</Estado>
                        </td>
                        {puedeGestionar && (
                          <td role="cell" data-label="Acciones" className="acciones">
                          {ejemplar.activo && ejemplar.disponible && (
                            <Link className="boton" to={`/prestamos/nuevo?ejemplarId=${ejemplar.id}`}>
                              Prestar
                            </Link>
                          )}
                          {ejemplar.activo ? (
                            <button type="button" onClick={() => void ejecutar(() => api.ejemplares.darDeBaja(ejemplar.id))}>
                              Dar de baja
                            </button>
                          ) : (
                            <button type="button" onClick={() => void ejecutar(() => api.ejemplares.reactivar(ejemplar.id))}>
                              Reactivar
                            </button>
                          )}
                          <button type="button" className="peligro" onClick={() => eliminar(ejemplar)}>
                            Eliminar
                          </button>
                        </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {lista.totalElements > MAXIMO && <p className="detalle">Se muestran los primeros {MAXIMO} de {lista.totalElements}.</p>}
          </>
        )}
      </CargaVista>
      {errorAccion !== null && <AvisoError error={errorAccion} />}
      {puedeGestionar && (
        <form className="formulario en-linea" onSubmit={agregar}>
        <label>
          Código del nuevo ejemplar
          <input value={codigo} onChange={(e) => setCodigo(e.target.value)} required maxLength={30} />
        </label>
        <button type="submit">Agregar ejemplar</button>
      </form>
      )}
    </section>
  )
}
