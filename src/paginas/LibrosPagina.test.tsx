// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/errores.ts'
import { pagina, renderizar } from '../pruebas/renderizar.ts'
import { LibrosPagina } from './LibrosPagina.tsx'

const faro = { id: 1, isbn: '9780306406157', titulo: 'El Faro Imaginado', autor: 'Autora Ficticia', anioPublicacion: 2001 }
const mar = { id: 2, isbn: '9783161484100', titulo: 'Mapas del Mar', autor: 'Autor Ficticio', anioPublicacion: null }

describe('LibrosPagina', () => {
  it('lists the books of the catalog with a link to each', async () => {
    const listar = vi.fn().mockResolvedValue(pagina([faro, mar]))
    renderizar(<LibrosPagina />, { api: { libros: { listar } } })

    const enlace = await screen.findByRole('link', { name: 'El Faro Imaginado' })

    expect(enlace.getAttribute('href')).toBe('/libros/1')
    expect(screen.getByText('Mapas del Mar')).toBeTruthy()
    expect(screen.getByText('—')).toBeTruthy()
    expect(listar).toHaveBeenCalledWith({ q: undefined, page: 0, size: 10 })
  })

  it('searches with the text that was sent', async () => {
    const listar = vi.fn().mockResolvedValue(pagina([faro]))
    renderizar(<LibrosPagina />, { api: { libros: { listar } } })
    await screen.findByText('El Faro Imaginado')

    await userEvent.type(screen.getByLabelText('Título o autor'), '  faro ')
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))

    await vi.waitFor(() => expect(listar).toHaveBeenLastCalledWith({ q: 'faro', page: 0, size: 10 }))
  })

  it('says so when nothing matches', async () => {
    renderizar(<LibrosPagina />, { api: { libros: { listar: vi.fn().mockResolvedValue(pagina([])) } }, ruta: '/libros?q=zzz' })

    expect(await screen.findByText('Ningún libro coincide con la búsqueda.')).toBeTruthy()
  })

  it('shows the failure in Spanish and loads again on retry', async () => {
    const listar = vi.fn().mockRejectedValueOnce(new ApiError(0, null, null)).mockResolvedValue(pagina([faro]))
    renderizar(<LibrosPagina />, { api: { libros: { listar } } })

    expect((await screen.findByRole('alert')).textContent).toContain('No se pudo contactar con la API.')
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('El Faro Imaginado')).toBeTruthy()
    expect(listar).toHaveBeenCalledTimes(2)
  })
})
