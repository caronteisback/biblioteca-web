// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { renderizar } from '../pruebas/renderizar.ts'
import { SocioDetallePagina } from './SocioDetallePagina.tsx'

const socio = {
  id: 5,
  nombre: 'Rosa Ficticia',
  email: 'rosa@example.org',
  activo: true,
  fechaRegistro: '2026-10-19',
  score: 85,
  alertas: [{ code: 'PENDING_FINE', message: 'The member has a pending fine.' }],
}

function pantalla(api: unknown, ruta = '/socios/5') {
  renderizar(
    <Routes>
      <Route path="/socios/:id" element={<SocioDetallePagina />} />
    </Routes>,
    { api, ruta },
  )
}

describe('SocioDetallePagina', () => {
  it('shows the score and the alerts in Spanish', async () => {
    pantalla({ socios: { obtener: vi.fn().mockResolvedValue(socio) } })

    expect(await screen.findByRole('heading', { name: 'Rosa Ficticia' })).toBeTruthy()
    expect(screen.getByText('19/10/2026')).toBeTruthy()
    expect(screen.getByText(/85 \/ 100/)).toBeTruthy()
    expect(screen.getByText('Tiene una multa pendiente.')).toBeTruthy()
  })

  it('deactivates the member and shows the new state', async () => {
    const obtener = vi.fn().mockResolvedValueOnce(socio).mockResolvedValue({ ...socio, activo: false })
    const desactivar = vi.fn().mockResolvedValue({})
    pantalla({ socios: { obtener, desactivar } })

    await userEvent.click(await screen.findByRole('button', { name: 'Desactivar' }))

    expect(await screen.findByRole('button', { name: 'Reactivar' })).toBeTruthy()
    expect(desactivar).toHaveBeenCalledWith(5)
    expect(screen.getByText('Desactivado')).toBeTruthy()
  })

  it('says the member does not exist for a bad address', () => {
    pantalla({ socios: { obtener: vi.fn() } }, '/socios/abc')

    expect(screen.getByRole('heading', { name: 'No encontrado' })).toBeTruthy()
  })
})
