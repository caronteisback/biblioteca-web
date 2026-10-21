import { useCallback } from 'react'
import { Link } from 'react-router'
import { useApi } from '../api/contexto.ts'
import { useCargar } from '../hooks/useCargar.ts'
import { formatearDia, formatearSoles } from '../formato.ts'
import { CargaVista } from './CargaVista.tsx'
import { EtiquetaDePrestamo } from './EtiquetaDePrestamo.tsx'

/** The active loans and the pending fines of a member, with the links to lend again or to see everything. */
export function ActividadDelSocio({ socioId, activo }: { socioId: number; activo: boolean }) {
  const api = useApi()
  const cargarPrestamos = useCallback(() => api.prestamos.listar({ socioId, activo: true, size: 20 }), [api, socioId])
  const [prestamos, recargarPrestamos] = useCargar(cargarPrestamos)
  const cargarMultas = useCallback(() => api.multas.listar({ socioId, estado: 'PENDING', size: 20 }), [api, socioId])
  const [multas, recargarMultas] = useCargar(cargarMultas)

  return (
    <>
      <section aria-labelledby="titulo-prestamos-socio">
        <h2 id="titulo-prestamos-socio">Préstamos activos</h2>
        <CargaVista carga={prestamos} reintentar={recargarPrestamos}>
          {(lista) =>
            lista.items.length === 0 ? (
              <p>No tiene préstamos activos.</p>
            ) : (
              <ul className="lista-simple">
                {lista.items.map((prestamo) => (
                  <li key={prestamo.id}>
                    <Link to={`/prestamos/${prestamo.id}`}>Préstamo #{prestamo.id}</Link> · vence{' '}
                    {formatearDia(prestamo.fechaVencimiento)} <EtiquetaDePrestamo prestamo={prestamo} />
                  </li>
                ))}
              </ul>
            )
          }
        </CargaVista>
        <p className="acciones">
          {activo && (
            <Link className="boton" to={`/prestamos/nuevo?socioId=${socioId}`}>
              Nuevo préstamo
            </Link>
          )}
          <Link to={`/prestamos?socioId=${socioId}`}>Ver todos sus préstamos</Link>
        </p>
      </section>

      <section aria-labelledby="titulo-multas-socio">
        <h2 id="titulo-multas-socio">Multas pendientes</h2>
        <CargaVista carga={multas} reintentar={recargarMultas}>
          {(lista) =>
            lista.items.length === 0 ? (
              <p>No tiene multas pendientes.</p>
            ) : (
              <ul className="lista-simple">
                {lista.items.map((multa) => (
                  <li key={multa.id}>
                    Multa #{multa.id} · {formatearSoles(multa.monto)} · {multa.diasRetraso} día(s) de retraso
                  </li>
                ))}
              </ul>
            )
          }
        </CargaVista>
        <p>
          <Link to={`/multas?socioId=${socioId}`}>Ver y pagar sus multas</Link>
        </p>
      </section>
    </>
  )
}
