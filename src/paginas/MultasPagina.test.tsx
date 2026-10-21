// @vitest-environment jsdom
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, MENSAJES } from '../api/errores.ts'
import { pagina, renderizar } from '../pruebas/renderizar.ts'
import { MultasPagina } from './MultasPagina.tsx'

const pendiente = { id: 1, prestamoId: 7, monto: 5, diasRetraso: 5, estado: 'PENDING', fechaGeneracion: '2026-10-24', fechaPago: null }
const pagada = { id: 2, prestamoId: 8, monto: 2.5, diasRetraso: 2, estado: 'PAID', fechaGeneracion: '2026-10-20', fechaPago: '2026-10-21' }

afterEach(() => vi.restoreAllMocks())

describe('MultasPagina', () => {
  it('lists fines with amount and state, and offers payment only for pending ones', async () => {
    const listar = vi.fn().mockResolvedValue(pagina([pendiente, pagada]))
    renderizar(<MultasPagina />, { api: { multas: { listar } } })

    const filaPendiente = (await screen.findByText('S/ 5.00')).closest('tr') as HTMLElement
    const filaPagada = screen.getByText('S/ 2.50').closest('tr') as HTMLElement

    expect(within(filaPendiente).getByText('Pendiente')).toBeTruthy()
    expect(within(filaPendiente).getByRole('button', { name: 'Pagar' })).toBeTruthy()
    expect(within(filaPagada).getByText('Pagada el 21/10/2026')).toBeTruthy()
    expect(within(filaPagada).queryByRole('button', { name: 'Pagar' })).toBeNull()
  })

  it('pays after confirming and loads the list again', async () => {
    const listar = vi.fn().mockResolvedValueOnce(pagina([pendiente])).mockResolvedValue(pagina([{ ...pendiente, estado: 'PAID', fechaPago: '2026-10-25' }]))
    const pagar = vi.fn().mockResolvedValue({})
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderizar(<MultasPagina />, { api: { multas: { listar, pagar } } })
    const boton = await screen.findByRole('button', { name: 'Pagar' })

    await userEvent.click(boton)
    expect(pagar).not.toHaveBeenCalled()

    confirmar.mockReturnValue(true)
    await userEvent.click(boton)

    expect(await screen.findByText('Pagada el 25/10/2026')).toBeTruthy()
    expect(pagar).toHaveBeenCalledWith(1)
  })

  it('says in Spanish when the fine was already paid', async () => {
    const pagar = vi.fn().mockRejectedValue(new ApiError(409, 'FINE_ALREADY_PAID', 'Already paid.'))
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderizar(<MultasPagina />, { api: { multas: { listar: vi.fn().mockResolvedValue(pagina([pendiente])), pagar } } })

    await userEvent.click(await screen.findByRole('button', { name: 'Pagar' }))

    expect((await screen.findByRole('alert')).textContent).toBe(MENSAJES.FINE_ALREADY_PAID)
  })

  it('filters by state through the address', async () => {
    const listar = vi.fn().mockResolvedValue(pagina([pendiente]))
    renderizar(<MultasPagina />, { api: { multas: { listar } }, ruta: '/multas?estado=PENDING&socioId=5' })

    await screen.findByText('S/ 5.00')

    expect(listar).toHaveBeenCalledWith({ socioId: 5, estado: 'PENDING', page: 0, size: 10 })
  })
})
