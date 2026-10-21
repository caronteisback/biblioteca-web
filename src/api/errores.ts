import type { components } from './schema.d.ts'

/** Every error code the contract can return. If the contract adds one, MENSAJES stops compiling until it is handled. */
export type CodigoError = components['schemas']['ErrorResponse']['code']

/** What the librarian reads for each code. The server's own text is English and meant for programs and logs. */
export const MENSAJES: Record<CodigoError, string> = {
  VALIDATION_ERROR: 'Hay datos incorrectos o incompletos.',
  BOOK_NOT_FOUND: 'El libro no existe.',
  COPY_NOT_FOUND: 'El ejemplar no existe.',
  MEMBER_NOT_FOUND: 'El socio no existe.',
  LOAN_NOT_FOUND: 'El préstamo no existe.',
  FINE_NOT_FOUND: 'La multa no existe.',
  ENDPOINT_NOT_FOUND: 'La dirección pedida no existe en la API.',
  METHOD_NOT_ALLOWED: 'La API no admite esa operación.',
  UNSUPPORTED_MEDIA_TYPE: 'La API solo acepta datos en formato JSON.',
  COPY_ALREADY_ON_LOAN: 'Ese ejemplar ya está prestado.',
  LOAN_ALREADY_RETURNED: 'Ese préstamo ya fue devuelto.',
  FINE_ALREADY_PAID: 'Esa multa ya está pagada.',
  DUPLICATE_ISBN: 'Ya existe un libro con ese ISBN.',
  DUPLICATE_EMAIL: 'Ya existe un socio con ese correo.',
  DUPLICATE_COPY_CODE: 'Ya existe un ejemplar con ese código.',
  BOOK_HAS_COPIES: 'El libro tiene ejemplares: elimínalos antes.',
  COPY_HAS_HISTORY: 'El ejemplar tiene préstamos en su historial; solo se puede dar de baja.',
  COPY_HAS_ACTIVE_LOAN: 'El ejemplar está prestado ahora mismo.',
  MEMBER_HAS_HISTORY: 'El socio tiene préstamos en su historial; solo se puede desactivar.',
  MEMBER_HAS_ACTIVE_LOANS: 'El socio tiene préstamos activos.',
  CONCURRENT_UPDATE: 'Otra persona está modificando lo mismo. Inténtalo de nuevo en unos segundos.',
  MEMBER_INACTIVE: 'El socio está desactivado.',
  COPY_INACTIVE: 'El ejemplar está dado de baja.',
  MEMBER_HAS_OVERDUE_LOAN: 'El socio tiene un préstamo vencido.',
  MEMBER_HAS_PENDING_FINE: 'El socio tiene una multa pendiente.',
  MEMBER_BLOCKED_BY_SCORE: 'El puntaje del socio es demasiado bajo para prestar.',
  LOAN_LIMIT_REACHED: 'El socio ya tiene el máximo de préstamos activos.',
  RENEWAL_LIMIT_REACHED: 'El préstamo ya usó todas sus renovaciones.',
  RENEWAL_NOT_ALLOWED_OVERDUE: 'Un préstamo vencido no se puede renovar.',
  INTERNAL_ERROR: 'La API tuvo un fallo interno. Inténtalo de nuevo.',
}

/** A failed call: the API answered with an error, or did not answer at all (`estado` 0, no `codigo`). */
export class ApiError extends Error {
  readonly estado: number
  readonly codigo: CodigoError | null
  /** The English text the server sent, kept for logs and for field details such as "titulo: must not be blank". */
  readonly detalleServidor: string | null

  constructor(estado: number, codigo: CodigoError | null, detalleServidor: string | null) {
    super(codigo ? MENSAJES[codigo] : estado === 0 ? 'No se pudo contactar con la API.' : `La API respondió ${estado}.`)
    this.name = 'ApiError'
    this.estado = estado
    this.codigo = codigo
    this.detalleServidor = detalleServidor
  }
}

/** The text to show for anything that went wrong. */
export function mensajeDe(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
}

function esCodigo(valor: unknown): valor is CodigoError {
  return typeof valor === 'string' && Object.hasOwn(MENSAJES, valor)
}

/** Builds an ApiError from the body the API sent with a failed answer, whatever that body turned out to be. */
export function errorDeRespuesta(estado: number, cuerpo: unknown): ApiError {
  if (typeof cuerpo === 'object' && cuerpo !== null) {
    const { code, message } = cuerpo as { code?: unknown; message?: unknown }
    return new ApiError(estado, esCodigo(code) ? code : null, typeof message === 'string' ? message : null)
  }
  return new ApiError(estado, null, null)
}
