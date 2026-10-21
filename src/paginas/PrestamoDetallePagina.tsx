import { useCallback, useState } from 'react'
import { Link } from 'react-router'
import { ALERTAS } from '../api/alertas.ts'
import type { Prestamo } from '../api/cliente.ts'
import { useApi } from '../api/contexto.ts'
import { AvisoError } from '../componentes/AvisoError.tsx'
import { CargaVista } from '../componentes/CargaVista.tsx'
import { EtiquetaDePrestamo } from '../componentes/EtiquetaDePrestamo.tsx'
import { NoEncontrada } from '../componentes/NoEncontrada.tsx'
import { useCargar } from '../hooks/useCargar.ts'
import { useIdDeRuta } from '../hooks/useIdDeRuta.ts'
import { formatearDia, formatearSoles } from '../formato.ts'

export function PrestamoDetallePagina() {
  const id = useIdDeRuta()
  return id === null ? <NoEncontrada que="El préstamo" /> : <PrestamoDetalle id={id} />
}

function PrestamoDetalle({ id }: { id: number }) {
  const api = useApi()
  const cargar = useCallback(() => api.prestamos.obtener(id), [api, id])
  const [carga, recargar] = useCargar(cargar)
  const [errorAccion, setErrorAccion] = useState<unknown>(null)

  async function ejecutar(accion: () => Promise<unknown>) {
    setErrorAccion(null)
    try {
      await accion()
      recargar()
    } catch (error) {
      setErrorAccion(error)
    }
  }

  function devolver() {
    if (window.confirm('¿Registrar la devolución? Si el préstamo está vencido se genera una multa.')) {
      void ejecutar(() => api.prestamos.devolver(id))
    }
  }

  return (
    <section>
      <p>
        <Link to="/prestamos">← Préstamos</Link>
      </p>
      <CargaVista carga={carga} reintentar={recargar}>
        {(prestamo) => (
          <>
            <h1>Préstamo #{prestamo.id}</h1>
            <dl className="ficha">
              <Relacionados prestamo={prestamo} />
              <dt>Prestado</dt>
              <dd>{formatearDia(prestamo.fechaPrestamo)}</dd>
              <dt>Vence</dt>
              <dd>{formatearDia(prestamo.fechaVencimiento)}</dd>
              <dt>Devuelto</dt>
              <dd>{prestamo.fechaDevolucion ? formatearDia(prestamo.fechaDevolucion) : '—'}</dd>
              <dt>Renovaciones</dt>
              <dd>{prestamo.renovaciones}</dd>
              <dt>Estado</dt>
              <dd>
                <EtiquetaDePrestamo prestamo={prestamo} />
              </dd>
            </dl>

            {prestamo.alertas.length > 0 && (
              <ul className="alertas" aria-label="Alertas">
                {prestamo.alertas.map((alerta) => (
                  <li key={alerta.code}>{ALERTAS[alerta.code]}</li>
                ))}
              </ul>
            )}

            {prestamo.multa && (
              <p className="aviso aviso-aviso">
                Multa de <strong>{formatearSoles(prestamo.multa.monto)}</strong> por {prestamo.multa.diasRetraso} día(s) de
                retraso: {prestamo.multa.estado === 'PAID' ? 'pagada' : 'pendiente de pago'}.{' '}
                <Link to={`/multas?socioId=${prestamo.socioId}`}>Ver multas del socio</Link>
              </p>
            )}

            {prestamo.activo && (
              <div className="acciones">
                <button type="button" onClick={() => void ejecutar(() => api.prestamos.renovar(id))}>
                  Renovar
                </button>
                <button type="button" onClick={devolver}>
                  Registrar devolución
                </button>
              </div>
            )}
            {errorAccion !== null && <AvisoError error={errorAccion} />}
          </>
        )}
      </CargaVista>
    </section>
  )
}

/** The member and the copy of the loan by name; if they cannot be read, by number. */
function Relacionados({ prestamo }: { prestamo: Prestamo }) {
  const api = useApi()
  const cargar = useCallback(async () => {
    const [socio, ejemplar] = await Promise.all([
      api.socios.obtener(prestamo.socioId),
      api.ejemplares.obtener(prestamo.ejemplarId),
    ])
    const libro = await api.libros.obtener(ejemplar.libroId)
    return { socio, ejemplar, libro }
  }, [api, prestamo.socioId, prestamo.ejemplarId])
  const [carga] = useCargar(cargar)

  const datos = carga.tipo === 'listo' ? carga.datos : null
  return (
    <>
      <dt>Socio</dt>
      <dd>
        <Link to={`/socios/${prestamo.socioId}`}>{datos ? datos.socio.nombre : `Socio #${prestamo.socioId}`}</Link>
      </dd>
      <dt>Ejemplar</dt>
      <dd>
        {datos ? (
          <>
            {datos.ejemplar.codigo} · <Link to={`/libros/${datos.libro.id}`}>{datos.libro.titulo}</Link>
          </>
        ) : (
          `Ejemplar #${prestamo.ejemplarId}`
        )}
      </dd>
    </>
  )
}
