import { describe, expect, it } from 'vitest'
import { ApiError, errorDeRespuesta, MENSAJES, mensajeDe } from './errores.ts'

describe('errorDeRespuesta', () => {
  it('keeps the code and shows the Spanish message for a known code', () => {
    const error = errorDeRespuesta(404, { code: 'BOOK_NOT_FOUND', message: 'The book does not exist.' })

    expect(error).toBeInstanceOf(ApiError)
    expect(error.estado).toBe(404)
    expect(error.codigo).toBe('BOOK_NOT_FOUND')
    expect(error.message).toBe(MENSAJES.BOOK_NOT_FOUND)
    expect(error.detalleServidor).toBe('The book does not exist.')
  })

  it('does not trust a code the contract does not list', () => {
    const error = errorDeRespuesta(409, { code: 'ALGO_NUEVO', message: 'x' })

    expect(error.codigo).toBeNull()
    expect(error.message).toBe('La API respondió 409.')
  })

  it('copes with a body that is not an error object', () => {
    expect(errorDeRespuesta(502, undefined).message).toBe('La API respondió 502.')
    expect(errorDeRespuesta(500, '<html>').codigo).toBeNull()
  })

  it('has a non-empty message for every code', () => {
    for (const [codigo, mensaje] of Object.entries(MENSAJES)) {
      expect(mensaje.length, codigo).toBeGreaterThan(10)
    }
  })
})

describe('mensajeDe', () => {
  it('reads the message of an error and has a fallback for anything else', () => {
    expect(mensajeDe(new ApiError(0, null, null))).toBe('No se pudo contactar con la API.')
    expect(mensajeDe('boom')).toBe('Ocurrió un error inesperado.')
  })
})
