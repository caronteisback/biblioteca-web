import { useCallback } from 'react'
import { ALERTAS } from '../api/alertas.ts'
import { useApi } from '../api/contexto.ts'
import { CargaVista } from '../componentes/CargaVista.tsx'
import { EtiquetaDePrestamo } from '../componentes/EtiquetaDePrestamo.tsx'
import { Titulo } from '../componentes/Titulo.tsx'
import { useCargar } from '../hooks/useCargar.ts'
import { formatearDia, formatearSoles } from '../formato.ts'

/** What a member can see about themselves: their score and alerts, their active loans and their pending fines. */
export function MiCuentaPagina() {
  const api = useApi()
  const cargarYo = useCallback(() => api.cuenta.yo(), [api])
  const [yo, recargarYo] = useCargar(cargarYo)
  const cargarPrestamos = useCallback(() => api.cuenta.misPrestamos({ activo: true, size: 50 }), [api])
  const [prestamos, recargarPrestamos] = useCargar(cargarPrestamos)
  const cargarMultas = useCallback(() => api.cuenta.misMultas({ estado: 'PENDING', size: 50 }), [api])
  const [multas, recargarMultas] = useCargar(cargarMultas)

  return (
    <section>
      <Titulo texto="Mi cuenta" />
      <h1>Mi cuenta</h1>
      <CargaVista carga={yo} reintentar={recargarYo}>
        {(usuario) =>
          usuario.socio ? (
            <>
              <dl className="ficha">
                <dt>Nombre</dt>
                <dd>{usuario.socio.nombre}</dd>
                <dt>Correo</dt>
                <dd>{usuario.email}</dd>
                <dt>Socio desde</dt>
                <dd>{formatearDia(usuario.socio.fechaRegistro)}</dd>
                <dt>Puntaje</dt>
                <dd>
                  <meter min={0} max={100} low={50} optimum={100} value={usuario.socio.score} aria-label="Puntaje" /> {usuario.socio.score} / 100
                </dd>
              </dl>
              {usuario.socio.alertas.length > 0 && (
                <ul className="alertas" aria-label="Alertas">
                  {usuario.socio.alertas.map((alerta) => (
                    <li key={alerta.code}>{ALERTAS[alerta.code]}</li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p>Tu usuario no está asociado a un socio.</p>
          )
        }
      </CargaVista>

      <section aria-labelledby="titulo-mis-prestamos">
        <h2 id="titulo-mis-prestamos">Mis préstamos activos</h2>
        <CargaVista carga={prestamos} reintentar={recargarPrestamos}>
          {(lista) =>
            lista.items.length === 0 ? (
              <p>No tienes préstamos activos.</p>
            ) : (
              <ul className="lista-simple">
                {lista.items.map((prestamo) => (
                  <li key={prestamo.id}>
                    <strong>{prestamo.tituloLibro}</strong> · ejemplar {prestamo.codigoEjemplar} · prestado el{' '}
                    {formatearDia(prestamo.fechaPrestamo)} · vence el {formatearDia(prestamo.fechaVencimiento)}{' '}
                    <EtiquetaDePrestamo prestamo={prestamo} />
                  </li>
                ))}
              </ul>
            )
          }
        </CargaVista>
      </section>

      <section aria-labelledby="titulo-mis-multas">
        <h2 id="titulo-mis-multas">Mis multas pendientes</h2>
        <CargaVista carga={multas} reintentar={recargarMultas}>
          {(lista) =>
            lista.items.length === 0 ? (
              <p>No tienes multas pendientes.</p>
            ) : (
              <>
                <ul className="lista-simple">
                  {lista.items.map((multa) => (
                    <li key={multa.id}>
                      {formatearSoles(multa.monto)} · {multa.diasRetraso} día(s) de retraso · generada el {formatearDia(multa.fechaGeneracion)}
                    </li>
                  ))}
                </ul>
                <p className="detalle">Las multas las cobra el personal de la biblioteca.</p>
              </>
            )
          }
        </CargaVista>
      </section>
    </section>
  )
}
