import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ALERTAS } from '../api/alertas.ts'
import { useApi } from '../api/contexto.ts'
import { ActividadDelSocio } from '../componentes/ActividadDelSocio.tsx'
import { AvisoError } from '../componentes/AvisoError.tsx'
import { CargaVista } from '../componentes/CargaVista.tsx'
import { NoEncontrada } from '../componentes/NoEncontrada.tsx'
import { useCargar } from '../hooks/useCargar.ts'
import { useIdDeRuta } from '../hooks/useIdDeRuta.ts'
import { formatearDia } from '../formato.ts'

export function SocioDetallePagina() {
  const id = useIdDeRuta()
  return id === null ? <NoEncontrada que="El socio" /> : <SocioDetalle id={id} />
}

function SocioDetalle({ id }: { id: number }) {
  const api = useApi()
  const navegar = useNavigate()
  const cargar = useCallback(() => api.socios.obtener(id), [api, id])
  const [carga, recargar] = useCargar(cargar)
  const [errorAccion, setErrorAccion] = useState<unknown>(null)

  async function ejecutar(accion: () => Promise<unknown>, alTerminar: () => void) {
    setErrorAccion(null)
    try {
      await accion()
      alTerminar()
    } catch (error) {
      setErrorAccion(error)
    }
  }

  function eliminar() {
    if (window.confirm('¿Eliminar este socio? Solo es posible si nunca tuvo préstamos.')) {
      void ejecutar(() => api.socios.eliminar(id), () => navegar('/socios'))
    }
  }

  return (
    <section>
      <p>
        <Link to="/socios">← Socios</Link>
      </p>
      <CargaVista carga={carga} reintentar={recargar}>
        {(socio) => (
          <>
            <h1>{socio.nombre}</h1>
            <dl className="ficha">
              <dt>Correo</dt>
              <dd>{socio.email}</dd>
              <dt>Registrado</dt>
              <dd>{formatearDia(socio.fechaRegistro)}</dd>
              <dt>Estado</dt>
              <dd>
                <span className={`etiqueta ${socio.activo ? 'etiqueta-disponible' : 'etiqueta-de-baja'}`}>
                  {socio.activo ? 'Activo' : 'Desactivado'}
                </span>
              </dd>
              <dt>Puntaje</dt>
              <dd>
                <meter min={0} max={100} low={50} optimum={100} value={socio.score} aria-label="Puntaje" /> {socio.score} / 100
              </dd>
            </dl>
            {socio.alertas.length > 0 && (
              <ul className="alertas" aria-label="Alertas">
                {socio.alertas.map((alerta) => (
                  <li key={alerta.code}>{ALERTAS[alerta.code]}</li>
                ))}
              </ul>
            )}
            <div className="acciones">
              <Link className="boton" to={`/socios/${socio.id}/editar`}>
                Editar
              </Link>
              {socio.activo ? (
                <button type="button" onClick={() => void ejecutar(() => api.socios.desactivar(id), recargar)}>
                  Desactivar
                </button>
              ) : (
                <button type="button" onClick={() => void ejecutar(() => api.socios.reactivar(id), recargar)}>
                  Reactivar
                </button>
              )}
              <button type="button" className="peligro" onClick={eliminar}>
                Eliminar socio
              </button>
            </div>
            {errorAccion !== null && <AvisoError error={errorAccion} />}
            <ActividadDelSocio socioId={socio.id} activo={socio.activo} />
          </>
        )}
      </CargaVista>
    </section>
  )
}
