import { ApiError, mensajeDe } from '../api/errores.ts'

/** The message of a failed call. For invalid data it adds the server's own detail, which names the field. */
export function AvisoError({ error }: { error: unknown }) {
  const detalle = error instanceof ApiError && error.codigo === 'VALIDATION_ERROR' ? error.detalleServidor : null
  return (
    <div role="alert" className="aviso aviso-error">
      <p>{mensajeDe(error)}</p>
      {detalle && <p className="detalle">{detalle}</p>}
    </div>
  )
}
