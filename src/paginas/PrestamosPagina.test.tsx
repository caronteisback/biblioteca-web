// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { pagina, renderizar } from '../pruebas/renderizar.ts'
import { PrestamosPagina } from './PrestamosPagina.tsx'

function prestamo(id: number, extra: object = {}) {
  return {
    id,
    socioId: 5,
    ejemplarId: 9,
    fechaPrestamo: '2026-10-19',
    fechaVencimiento: '2026-11-02',
    fechaDevolucion: null,
    renovaciones: 0,
    activo: true,
    diasRetraso: 0,
    alertas: [],
    multa: null,
    ...extra,
  }
}

describe('PrestamosPagina', () => {
  it('lists loans with their state: active, overdue or returned', async () => {
    const listar = vi.fn().mockResolvedValue(
      pagina([
        prestamo(1),
        prestamo(2, { diasRetraso: 5, fechaVencimiento: '2026-10-14' }),
        prestamo(3, { activo: false, fechaDevolucion: '2026-10-20' }),
      ]),
    )
    renderizar(<PrestamosPagina />, { api: { prestamos: { listar } } })

    expect(await screen.findByText('Activo')).toBeTruthy()
    expect(screen.getByText('Vencido (5 d)')).toBeTruthy()
    expect(screen.getByText('Devuelto')).toBeTruthy()
    expect(screen.getAllByText('02/11/2026')).toHaveLength(2)
    expect(screen.getByRole('link', { name: '#2' }).getAttribute('href')).toBe('/prestamos/2')
  })

  it('asks only for active loans when that filter is chosen', async () => {
    const listar = vi.fn().mockResolvedValue(pagina([prestamo(1)]))
    renderizar(<PrestamosPagina />, { api: { prestamos: { listar } } })
    await screen.findByText('Activo')

    await userEvent.selectOptions(screen.getByLabelText('Mostrar'), 'activos')

    await vi.waitFor(() => expect(listar).toHaveBeenLastCalledWith({ socioId: undefined, activo: true, page: 0, size: 10 }))
  })

  it('filters by the member in the address and offers to remove the filter', async () => {
    const listar = vi.fn().mockResolvedValue(pagina([prestamo(1)]))
    renderizar(<PrestamosPagina />, { api: { prestamos: { listar } }, ruta: '/prestamos?socioId=5&estado=devueltos' })

    await screen.findByText('Activo')

    expect(listar).toHaveBeenCalledWith({ socioId: 5, activo: false, page: 0, size: 10 })
    await userEvent.click(screen.getByRole('button', { name: 'Quitar filtro' }))
    await vi.waitFor(() => expect(listar).toHaveBeenLastCalledWith({ socioId: undefined, activo: false, page: 0, size: 10 }))
  })
})
