// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { ApiError, MENSAJES } from '../api/errores.ts'
import { pagina, renderizar } from '../pruebas/renderizar.ts'
import { NuevoPrestamoPagina } from './NuevoPrestamoPagina.tsx'

const rosa = { id: 5, nombre: 'Rosa Ficticia', email: 'rosa@example.org', activo: true, fechaRegistro: '2026-10-19' }
const inactivo = { id: 6, nombre: 'Luis Ficticio', email: 'luis@example.org', activo: false, fechaRegistro: '2026-10-19' }
const faro = { id: 3, isbn: '9780306406157', titulo: 'El Faro Imaginado', autor: 'Autora Ficticia', anioPublicacion: 2001 }
const libre = { id: 9, libroId: 3, codigo: 'EJ-9', activo: true, disponible: true }
const prestado = { id: 8, libroId: 3, codigo: 'EJ-8', activo: true, disponible: false }

function apiBase(extra: Record<string, unknown> = {}) {
  return {
    socios: { listar: vi.fn().mockResolvedValue(pagina([rosa, inactivo])), obtener: vi.fn().mockResolvedValue(rosa) },
    libros: { listar: vi.fn().mockResolvedValue(pagina([faro])), obtener: vi.fn().mockResolvedValue(faro) },
    ejemplares: {
      listarDeLibro: vi.fn().mockResolvedValue(pagina([prestado, libre])),
      obtener: vi.fn().mockResolvedValue(libre),
    },
    prestamos: { crear: vi.fn().mockResolvedValue({ id: 42 }) },
    ...extra,
  }
}

function pantalla(api: unknown, ruta = '/prestamos/nuevo') {
  renderizar(
    <Routes>
      <Route path="/prestamos/nuevo" element={<NuevoPrestamoPagina />} />
      <Route path="/prestamos/:id" element={<p>Detalle del préstamo</p>} />
    </Routes>,
    { api, ruta },
  )
}

async function elegirSocioYEjemplar() {
  await userEvent.type(await screen.findByLabelText('Buscar socio por nombre o correo'), 'ro')
  await userEvent.click(screen.getByRole('button', { name: 'Buscar socio' }))
  await userEvent.click(await screen.findByRole('button', { name: /Rosa Ficticia/ }))
  await userEvent.type(screen.getByLabelText('Buscar libro por título o autor'), 'faro')
  await userEvent.click(screen.getByRole('button', { name: 'Buscar libro' }))
  await userEvent.click(await screen.findByRole('button', { name: /El Faro Imaginado/ }))
}

describe('NuevoPrestamoPagina', () => {
  it('lends the chosen copy to the chosen member and opens the loan', async () => {
    const api = apiBase()
    pantalla(api)

    await elegirSocioYEjemplar()
    await userEvent.click(await screen.findByRole('button', { name: 'EJ-9' }))
    await userEvent.click(screen.getByRole('button', { name: 'Prestar' }))

    expect(await screen.findByText('Detalle del préstamo')).toBeTruthy()
    expect(api.prestamos.crear).toHaveBeenCalledWith(5, 9)
  })

  it('offers only the copies that are available, and no deactivated member', async () => {
    pantalla(apiBase())

    await userEvent.type(await screen.findByLabelText('Buscar socio por nombre o correo'), 'l')
    await userEvent.click(screen.getByRole('button', { name: 'Buscar socio' }))
    expect(((await screen.findByRole('button', { name: /Luis Ficticio/ })) as HTMLButtonElement).disabled).toBe(true)

    await userEvent.type(screen.getByLabelText('Buscar libro por título o autor'), 'faro')
    await userEvent.click(screen.getByRole('button', { name: 'Buscar libro' }))
    await userEvent.click(await screen.findByRole('button', { name: /El Faro Imaginado/ }))

    expect(await screen.findByRole('button', { name: 'EJ-9' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'EJ-8' })).toBeNull()
  })

  it('cannot lend until both are chosen', async () => {
    pantalla(apiBase())

    expect(((await screen.findByRole('button', { name: 'Prestar' })) as HTMLButtonElement).disabled).toBe(true)
  })

  it('shows why the API refused the loan and keeps the choices', async () => {
    const crear = vi.fn().mockRejectedValue(new ApiError(422, 'MEMBER_HAS_PENDING_FINE', 'Pending fine.'))
    pantalla(apiBase({ prestamos: { crear } }))

    await elegirSocioYEjemplar()
    await userEvent.click(await screen.findByRole('button', { name: 'EJ-9' }))
    await userEvent.click(screen.getByRole('button', { name: 'Prestar' }))

    expect((await screen.findByRole('alert')).textContent).toBe(MENSAJES.MEMBER_HAS_PENDING_FINE)
    expect(screen.getByText('Rosa Ficticia')).toBeTruthy()
    expect(screen.getByText('EJ-9')).toBeTruthy()
  })

  it('opens with the copy already chosen when it comes from a copy', async () => {
    pantalla(apiBase(), '/prestamos/nuevo?ejemplarId=9')

    expect(await screen.findByText('EJ-9')).toBeTruthy()
    expect(screen.getByText(/El Faro Imaginado/)).toBeTruthy()
    expect(screen.queryByLabelText('Buscar libro por título o autor')).toBeNull()
    expect(screen.getByLabelText('Buscar socio por nombre o correo')).toBeTruthy()
  })
})
