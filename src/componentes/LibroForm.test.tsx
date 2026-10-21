// @vitest-environment jsdom
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/errores.ts'
import { renderizar } from '../pruebas/renderizar.ts'
import { LibroForm } from './LibroForm.tsx'

async function rellenar() {
  await userEvent.type(screen.getByLabelText(/ISBN/), ' 978-0-306-40615-7 ')
  await userEvent.type(screen.getByLabelText('Título'), 'El Faro Imaginado')
  await userEvent.type(screen.getByLabelText('Autor'), 'Autora Ficticia')
}

describe('LibroForm', () => {
  it('sends the trimmed values and leaves the year out when it is empty', async () => {
    const alEnviar = vi.fn().mockResolvedValue(undefined)
    renderizar(<LibroForm textoEnviar="Crear libro" cancelar="/libros" alEnviar={alEnviar} />)

    await rellenar()
    await userEvent.click(screen.getByRole('button', { name: 'Crear libro' }))

    expect(alEnviar).toHaveBeenCalledWith({
      isbn: '978-0-306-40615-7',
      titulo: 'El Faro Imaginado',
      autor: 'Autora Ficticia',
      anioPublicacion: undefined,
    })
  })

  it('sends the year as a number', async () => {
    const alEnviar = vi.fn().mockResolvedValue(undefined)
    renderizar(<LibroForm textoEnviar="Crear libro" cancelar="/libros" alEnviar={alEnviar} />)

    await rellenar()
    await userEvent.type(screen.getByLabelText(/Año de publicación/), '2001')
    await userEvent.click(screen.getByRole('button', { name: 'Crear libro' }))

    expect(alEnviar.mock.calls[0][0].anioPublicacion).toBe(2001)
  })

  it('shows what the API said and lets the user try again', async () => {
    const alEnviar = vi
      .fn()
      .mockRejectedValue(new ApiError(409, 'DUPLICATE_ISBN', 'A book with that ISBN already exists.'))
    renderizar(<LibroForm textoEnviar="Crear libro" cancelar="/libros" alEnviar={alEnviar} />)

    await rellenar()
    await userEvent.click(screen.getByRole('button', { name: 'Crear libro' }))

    expect((await screen.findByRole('alert')).textContent).toBe('Ya existe un libro con ese ISBN.')
    expect((screen.getByRole('button', { name: 'Crear libro' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('adds the detail of an invalid field to the message', async () => {
    const alEnviar = vi.fn().mockRejectedValue(new ApiError(400, 'VALIDATION_ERROR', 'isbn: not a valid ISBN'))
    renderizar(<LibroForm textoEnviar="Crear libro" cancelar="/libros" alEnviar={alEnviar} />)

    await rellenar()
    await userEvent.click(screen.getByRole('button', { name: 'Crear libro' }))

    const aviso = await screen.findByRole('alert')
    expect(aviso.textContent).toContain('Hay datos incorrectos o incompletos.')
    expect(aviso.textContent).toContain('isbn: not a valid ISBN')
  })
})
