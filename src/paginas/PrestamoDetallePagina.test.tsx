// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, MENSAJES } from '../api/errores.ts'
import { renderizar } from '../pruebas/renderizar.ts'
import { PrestamoDetallePagina } from './PrestamoDetallePagina.tsx'

const prestamo = {
  id: 7,
  socioId: 5,
  ejemplarId: 9,
  fechaPrestamo: '2026-10-19',
  fechaVencimiento: '2026-11-02',
  fechaDevolucion: null,
  renovaciones: 1,
  activo: true,
  diasRetraso: 0,
  alertas: [{ code: 'DUE_SOON', message: 'Due in 3 days.' }],
  multa: null,
}

const relacionados = {
  socios: { obtener: vi.fn().mockResolvedValue({ id: 5, nombre: 'Rosa Ficticia' }) },
  ejemplares: { obtener: vi.fn().mockResolvedValue({ id: 9, libroId: 3, codigo: 'EJ-9' }) },
  libros: { obtener: vi.fn().mockResolvedValue({ id: 3, titulo: 'El Faro Imaginado' }) },
}

function pantalla(prestamos: Record<string, unknown>) {
  renderizar(
    <Routes>
      <Route path="/prestamos/:id" element={<PrestamoDetallePagina />} />
    </Routes>,
    { api: { ...relacionados, prestamos }, ruta: '/prestamos/7' },
  )
}

afterEach(() => vi.restoreAllMocks())

describe('PrestamoDetallePagina', () => {
  it('shows the member and the copy by name, the dates and the alerts', async () => {
    pantalla({ obtener: vi.fn().mockResolvedValue(prestamo) })

    expect(await screen.findByRole('link', { name: 'Rosa Ficticia' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'El Faro Imaginado' })).toBeTruthy()
    expect(screen.getByText(/EJ-9/)).toBeTruthy()
    expect(screen.getByText('19/10/2026')).toBeTruthy()
    expect(screen.getByText('Un préstamo vence pronto.')).toBeTruthy()
  })

  it('renews and shows the new state', async () => {
    const obtener = vi.fn().mockResolvedValueOnce(prestamo).mockResolvedValue({ ...prestamo, renovaciones: 2 })
    const renovar = vi.fn().mockResolvedValue({})
    pantalla({ obtener, renovar })

    await userEvent.click(await screen.findByRole('button', { name: 'Renovar' }))

    await vi.waitFor(() => expect(screen.getByText('2')).toBeTruthy())
    expect(renovar).toHaveBeenCalledWith(7)
  })

  it('explains in Spanish why a renewal was refused', async () => {
    const renovar = vi.fn().mockRejectedValue(new ApiError(422, 'RENEWAL_LIMIT_REACHED', 'No more renewals.'))
    pantalla({ obtener: vi.fn().mockResolvedValue(prestamo), renovar })

    await userEvent.click(await screen.findByRole('button', { name: 'Renovar' }))

    expect((await screen.findByRole('alert')).textContent).toBe(MENSAJES.RENEWAL_LIMIT_REACHED)
  })

  it('returns only after confirming, and then shows the fine it created', async () => {
    const devuelto = {
      ...prestamo,
      activo: false,
      fechaDevolucion: '2026-10-24',
      diasRetraso: 5,
      multa: { id: 1, prestamoId: 7, monto: 5, diasRetraso: 5, estado: 'PENDING', fechaGeneracion: '2026-10-24', fechaPago: null },
    }
    const obtener = vi.fn().mockResolvedValueOnce(prestamo).mockResolvedValue(devuelto)
    const devolver = vi.fn().mockResolvedValue({})
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false)
    pantalla({ obtener, devolver })
    const boton = await screen.findByRole('button', { name: 'Registrar devolución' })

    await userEvent.click(boton)
    expect(devolver).not.toHaveBeenCalled()

    confirmar.mockReturnValue(true)
    await userEvent.click(boton)

    expect(await screen.findByText('S/ 5.00')).toBeTruthy()
    expect(screen.getByText(/pendiente de pago/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Renovar' })).toBeNull()
  })
})
