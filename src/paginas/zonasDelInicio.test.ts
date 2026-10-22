import { describe, expect, it } from 'vitest'
import { zonaDe } from '../componentes/zonas.ts'
import { zonasDeLosLibros, zonasDelPuntaje } from './zonasDelInicio.ts'

describe('the zones of the score', () => {
  const zonas = zonasDelPuntaje(50)

  it.each([
    [0, 'error', 'Bloqueado'],
    [49, 'error', 'Bloqueado'],
    [50, 'aviso', 'En riesgo'],
    [79, 'aviso', 'En riesgo'],
    [80, 'ok', 'Bueno'],
    [100, 'ok', 'Bueno'],
  ] as const)('puts a score of %i in the %s zone (%s)', (puntaje, tono, etiqueta) => {
    expect(zonaDe(zonas, puntaje)).toMatchObject({ tono, etiqueta })
  })

  it('moves the red zone with the minimum the API sends', () => {
    expect(zonaDe(zonasDelPuntaje(70), 60).tono).toBe('error')
    expect(zonaDe(zonasDelPuntaje(70), 75).tono).toBe('aviso')
  })

  it('has no amber zone when the minimum is as high as "good"', () => {
    const zonasAltas = zonasDelPuntaje(90)
    expect(zonasAltas.map((z) => z.tono)).toEqual(['error', 'ok'])
    expect(zonaDe(zonasAltas, 85).tono).toBe('error')
  })

  it('has no red zone when nobody is ever blocked', () => {
    expect(zonasDelPuntaje(0).map((z) => z.tono)).toEqual(['aviso', 'ok'])
  })
})

describe('the zones of the loans against the limit', () => {
  const etiquetaCon = (maximo: number, usados: number) => zonaDe(zonasDeLosLibros(maximo, usados), usados)

  it.each([
    [0, 'ok', 'Puedes pedir más'],
    [1, 'ok', 'Puedes pedir más'],
    [2, 'ok', 'Puedes pedir más'],
    [3, 'aviso', 'Te quedan 2'],
    [4, 'aviso', 'Te queda 1'],
    [5, 'error', 'Límite alcanzado'],
  ] as const)('with %i of 5 the zone is %s (%s)', (usados, tono, etiqueta) => {
    expect(etiquetaCon(5, usados)).toMatchObject({ tono, etiqueta })
  })

  it('follows the limit the API sends', () => {
    expect(etiquetaCon(3, 1).tono).toBe('ok')
    expect(etiquetaCon(3, 2)).toMatchObject({ tono: 'aviso', etiqueta: 'Te queda 1' })
    expect(etiquetaCon(3, 3).tono).toBe('error')
  })

  it('works with a limit of 1 and of 2, where there is no room for an amber zone', () => {
    expect(zonasDeLosLibros(1, 0).map((z) => z.tono)).toEqual(['ok', 'error'])
    expect(zonasDeLosLibros(2, 0).map((z) => z.tono)).toEqual(['ok', 'error'])
    expect(etiquetaCon(2, 2).tono).toBe('error')
  })

  it('keeps counting as "limit reached" if there are more loans than the limit (the limit was lowered)', () => {
    expect(etiquetaCon(5, 7).tono).toBe('error')
  })
})
