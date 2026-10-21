// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError, MENSAJES } from '../api/errores.ts'
import { pagina, renderizar } from '../pruebas/renderizar.ts'
import { MiCuentaPagina } from './MiCuentaPagina.tsx'

const usuario = {
  id: 7,
  email: 'rosa@example.org',
  rol: 'MEMBER',
  socio: {
    id: 5,
    nombre: 'Rosa Ficticia',
    email: 'rosa@example.org',
    activo: true,
    fechaRegistro: '2026-10-19',
    score: 85,
    alertas: [{ code: 'PENDING_FINE', message: 'Pending fine.' }],
  },
}
const prestamo = {
  id: 3,
  socioId: 5,
  ejemplarId: 9,
  fechaPrestamo: '2026-10-02',
  fechaVencimiento: '2026-10-16',
  fechaDevolucion: null,
  renovaciones: 0,
  activo: true,
  diasRetraso: 5,
  alertas: [],
  multa: null,
}
const multa = { id: 1, prestamoId: 2, monto: 11, diasRetraso: 11, estado: 'PENDING', fechaGeneracion: '2026-10-10', fechaPago: null }

function pantalla(cuenta: Record<string, unknown>) {
  renderizar(<MiCuentaPagina />, {
    api: {
      cuenta: {
        yo: vi.fn().mockResolvedValue(usuario),
        misPrestamos: vi.fn().mockResolvedValue(pagina([prestamo])),
        misMultas: vi.fn().mockResolvedValue(pagina([multa])),
        ...cuenta,
      },
    },
    sesion: 'MEMBER',
  })
}

describe('MiCuentaPagina', () => {
  it('shows the member, the score and the alerts in Spanish', async () => {
    pantalla({})

    expect(await screen.findByText('Rosa Ficticia')).toBeTruthy()
    expect(screen.getByText('19/10/2026')).toBeTruthy()
    expect(screen.getByText(/85 \/ 100/)).toBeTruthy()
    expect(screen.getByText('Tiene una multa pendiente.')).toBeTruthy()
  })

  it('lists only their active loans, with the state, and their pending fines', async () => {
    const misPrestamos = vi.fn().mockResolvedValue(pagina([prestamo]))
    const misMultas = vi.fn().mockResolvedValue(pagina([multa]))
    pantalla({ misPrestamos, misMultas })

    expect(await screen.findByText('Vencido (5 d)')).toBeTruthy()
    expect(screen.getByText(/vence el 16\/10\/2026/)).toBeTruthy()
    expect(await screen.findByText(/S\/ 11\.00 · 11 día\(s\) de retraso/)).toBeTruthy()
    expect(misPrestamos).toHaveBeenCalledWith({ activo: true, size: 50 })
    expect(misMultas).toHaveBeenCalledWith({ estado: 'PENDING', size: 50 })
  })

  it('never asks for a member: the API knows who is signed in', async () => {
    const misPrestamos = vi.fn().mockResolvedValue(pagina([]))
    pantalla({ misPrestamos })

    await screen.findByText('No tienes préstamos activos.')

    expect(JSON.stringify(misPrestamos.mock.calls)).not.toContain('socioId')
  })

  it('says so when there is nothing to show', async () => {
    pantalla({ misPrestamos: vi.fn().mockResolvedValue(pagina([])), misMultas: vi.fn().mockResolvedValue(pagina([])) })

    expect(await screen.findByText('No tienes préstamos activos.')).toBeTruthy()
    expect(await screen.findByText('No tienes multas pendientes.')).toBeTruthy()
  })

  it('shows a failure of one section without hiding the others, and retries it', async () => {
    const misMultas = vi.fn().mockRejectedValueOnce(new ApiError(500, 'INTERNAL_ERROR', 'x')).mockResolvedValue(pagina([multa]))
    pantalla({ misMultas })

    expect((await screen.findByRole('alert')).textContent).toBe(MENSAJES.INTERNAL_ERROR)
    expect(await screen.findByText('Rosa Ficticia')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText(/S\/ 11\.00/)).toBeTruthy()
  })
})
