// @vitest-environment jsdom
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MENSAJES, ApiError } from '../api/errores.ts'
import { pagina, renderizar } from '../pruebas/renderizar.ts'
import { EjemplaresDelLibro } from './EjemplaresDelLibro.tsx'

const libre = { id: 1, libroId: 7, codigo: 'EJ-1', activo: true, disponible: true }
const prestado = { id: 2, libroId: 7, codigo: 'EJ-2', activo: true, disponible: false }
const deBaja = { id: 3, libroId: 7, codigo: 'EJ-3', activo: false, disponible: false }

type Funcion = ReturnType<typeof vi.fn>

function apiCon(ejemplares: Record<string, Funcion>) {
  const todos: Record<string, Funcion> = {
    listarDeLibro: vi.fn().mockResolvedValue(pagina([libre, prestado, deBaja])),
    ...ejemplares,
  }
  return { ejemplares: todos }
}

afterEach(() => vi.restoreAllMocks())

describe('EjemplaresDelLibro', () => {
  it('shows whether each copy is available, on loan or retired', async () => {
    renderizar(<EjemplaresDelLibro libroId={7} />, { api: apiCon({}) })

    const fila = async (codigo: string) => (await screen.findByText(codigo)).closest('tr') as HTMLElement
    expect(within(await fila('EJ-1')).getByText('Disponible')).toBeTruthy()
    expect(within(await fila('EJ-2')).getByText('Prestado')).toBeTruthy()
    expect(within(await fila('EJ-3')).getByText('De baja')).toBeTruthy()
    expect(within(await fila('EJ-3')).getByRole('button', { name: 'Reactivar' })).toBeTruthy()
  })

  it('adds a copy, clears the box and loads the list again', async () => {
    const api = apiCon({ crear: vi.fn().mockResolvedValue({}) })
    renderizar(<EjemplaresDelLibro libroId={7} />, { api })
    await screen.findByText('EJ-1')

    const caja = screen.getByLabelText('Código del nuevo ejemplar') as HTMLInputElement
    await userEvent.type(caja, ' EJ-9 ')
    await userEvent.click(screen.getByRole('button', { name: 'Agregar ejemplar' }))

    await vi.waitFor(() => expect(api.ejemplares.listarDeLibro).toHaveBeenCalledTimes(2))
    expect(api.ejemplares.crear).toHaveBeenCalledWith(7, 'EJ-9')
    expect(caja.value).toBe('')
  })

  it('explains in Spanish why a copy could not be retired', async () => {
    const darDeBaja = vi.fn().mockRejectedValue(new ApiError(409, 'COPY_HAS_ACTIVE_LOAN', 'The copy is on loan.'))
    renderizar(<EjemplaresDelLibro libroId={7} />, { api: apiCon({ darDeBaja }) })
    const fila = (await screen.findByText('EJ-2')).closest('tr') as HTMLElement

    await userEvent.click(within(fila).getByRole('button', { name: 'Dar de baja' }))

    expect((await screen.findByRole('alert')).textContent).toBe(MENSAJES.COPY_HAS_ACTIVE_LOAN)
  })

  it('does not delete a copy unless the user confirms', async () => {
    const eliminar = vi.fn().mockResolvedValue(undefined)
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderizar(<EjemplaresDelLibro libroId={7} />, { api: apiCon({ eliminar }) })
    const fila = (await screen.findByText('EJ-1')).closest('tr') as HTMLElement

    await userEvent.click(within(fila).getByRole('button', { name: 'Eliminar' }))
    expect(eliminar).not.toHaveBeenCalled()

    confirmar.mockReturnValue(true)
    await userEvent.click(within(fila).getByRole('button', { name: 'Eliminar' }))
    expect(eliminar).toHaveBeenCalledWith(1)
  })
})
