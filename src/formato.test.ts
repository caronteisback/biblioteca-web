import { describe, expect, it } from 'vitest'
import { estadoDelEjemplar, estadoDelPrestamo, formatearDia, formatearSemana, formatearSoles } from './formato.ts'

describe('formatearDia', () => {
  it('writes a day as day/month/year', () => {
    expect(formatearDia('2026-10-19')).toBe('19/10/2026')
  })

  it('returns anything else as it came', () => {
    expect(formatearDia('ayer')).toBe('ayer')
    expect(formatearDia('')).toBe('')
  })
})

describe('formatearSemana', () => {
  it('writes a day as a short day and month', () => {
    expect(formatearSemana('2026-10-12')).toBe('12 oct')
    expect(formatearSemana('2026-01-05')).toBe('5 ene')
    expect(formatearSemana('2026-12-28')).toBe('28 dic')
  })

  it('returns anything else as it came', () => {
    expect(formatearSemana('pronto')).toBe('pronto')
  })
})

describe('estadoDelEjemplar', () => {
  it('tells retired, on loan and available apart', () => {
    expect(estadoDelEjemplar({ activo: false, disponible: false })).toBe('De baja')
    expect(estadoDelEjemplar({ activo: true, disponible: false })).toBe('Prestado')
    expect(estadoDelEjemplar({ activo: true, disponible: true })).toBe('Disponible')
  })
})

describe('formatearSoles', () => {
  it('writes money with the sol sign and two decimals', () => {
    expect(formatearSoles(5)).toBe('S/ 5.00')
    expect(formatearSoles(2.5)).toBe('S/ 2.50')
  })
})

describe('estadoDelPrestamo', () => {
  it('tells returned, overdue and active apart', () => {
    expect(estadoDelPrestamo({ activo: false, diasRetraso: 3 })).toBe('Devuelto')
    expect(estadoDelPrestamo({ activo: true, diasRetraso: 3 })).toBe('Vencido')
    expect(estadoDelPrestamo({ activo: true, diasRetraso: 0 })).toBe('Activo')
  })
})
