import { describe, expect, it } from 'vitest'
import { estadoDelEjemplar, formatearDia } from './formato.ts'

describe('formatearDia', () => {
  it('writes a day as day/month/year', () => {
    expect(formatearDia('2026-10-19')).toBe('19/10/2026')
  })

  it('returns anything else as it came', () => {
    expect(formatearDia('ayer')).toBe('ayer')
    expect(formatearDia('')).toBe('')
  })
})

describe('estadoDelEjemplar', () => {
  it('tells retired, on loan and available apart', () => {
    expect(estadoDelEjemplar({ activo: false, disponible: false })).toBe('De baja')
    expect(estadoDelEjemplar({ activo: true, disponible: false })).toBe('Prestado')
    expect(estadoDelEjemplar({ activo: true, disponible: true })).toBe('Disponible')
  })
})
