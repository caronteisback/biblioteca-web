// @vitest-environment jsdom
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { MENSAJES } from './api/errores.ts'
import { crearApiEnMemoria } from './pruebas/apiEnMemoria.ts'
import { renderizar } from './pruebas/renderizar.ts'

afterEach(() => vi.restoreAllMocks())

const ir = (nombre: RegExp) => userEvent.click(screen.getByRole('link', { name: nombre }))
const escribir = (etiqueta: string | RegExp, texto: string) => userEvent.type(screen.getByLabelText(etiqueta), texto)
const pulsar = async (nombre: string | RegExp) => userEvent.click(await screen.findByRole('button', { name: nombre }))

/** Chooses a member and a copy in the new-loan screen, searching as a librarian would. */
async function elegirSocioYEjemplar(socio: string, libro: string, codigo: string) {
  await escribir('Buscar socio por nombre o correo', socio)
  await pulsar('Buscar socio')
  await userEvent.click(await screen.findByRole('button', { name: /Rosa Ficticia/ }))
  await escribir('Buscar libro por título o autor', libro)
  await pulsar('Buscar libro')
  await userEvent.click(await screen.findByRole('button', { name: /El Faro Imaginado/ }))
  await pulsar(codigo)
}

describe('the life of a loan through the whole application', () => {
  it('registers a book, a copy and a member, lends, refuses a late renewal, fines the return and takes the payment', async () => {
    const memoria = crearApiEnMemoria()
    renderizar(<App />, { api: memoria.api, ruta: '/' })

    // The catalog starts empty and gets a book with a copy.
    expect(await screen.findByText('Todavía no hay libros en el catálogo.')).toBeTruthy()
    await ir(/^Nuevo libro$/)
    await escribir(/ISBN/, '978-0-306-40615-7')
    await escribir('Título', 'El Faro Imaginado')
    await escribir('Autor', 'Autora Ficticia')
    await pulsar('Crear libro')
    expect(await screen.findByRole('heading', { name: 'El Faro Imaginado' })).toBeTruthy()
    await escribir('Código del nuevo ejemplar', 'EJ-1')
    await pulsar('Agregar ejemplar')
    expect(await screen.findByText('Disponible')).toBeTruthy()

    // A member is registered and starts with a clean score.
    await ir(/^Socios$/)
    await ir(/^Nuevo socio$/)
    await escribir('Nombre', 'Rosa Ficticia')
    await escribir('Correo', 'rosa@example.org')
    await pulsar('Registrar socio')
    expect(await screen.findByText(/100 \/ 100/)).toBeTruthy()

    // The copy is lent from the book's own screen: the copy comes chosen, only the member is asked.
    await ir(/^Libros$/)
    await userEvent.click(await screen.findByRole('link', { name: 'El Faro Imaginado' }))
    await userEvent.click(await screen.findByRole('link', { name: 'Prestar' }))
    expect(await screen.findByText('EJ-1')).toBeTruthy()
    await escribir('Buscar socio por nombre o correo', 'rosa')
    await pulsar('Buscar socio')
    await userEvent.click(await screen.findByRole('button', { name: /Rosa Ficticia/ }))
    await pulsar('Prestar')
    expect(await screen.findByRole('heading', { name: /Préstamo #/ })).toBeTruthy()
    expect(screen.getByText('Activo')).toBeTruthy()

    // Weeks pass. The loan is overdue, and the renewal is refused with the reason.
    memoria.envejecerPrestamos(19)
    await ir(/^Préstamos$/)
    // The first link of the row is the loan; the next ones are its member.
    await userEvent.click((await screen.findAllByRole('link', { name: /^#\d+$/ }))[0])
    expect(await screen.findByText('Vencido (5 d)')).toBeTruthy()
    await pulsar('Renovar')
    expect((await screen.findByRole('alert')).textContent).toBe(MENSAJES.RENEWAL_NOT_ALLOWED_OVERDUE)

    // The return creates the fine.
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    await pulsar('Registrar devolución')
    expect(await screen.findByText('S/ 5.00')).toBeTruthy()
    expect(screen.getByText(/pendiente de pago/)).toBeTruthy()

    // With a pending fine the member cannot borrow again.
    await ir(/^Préstamos$/)
    await ir(/^Nuevo préstamo$/)
    await elegirSocioYEjemplar('rosa', 'faro', 'EJ-1')
    await pulsar('Prestar')
    expect((await screen.findByRole('alert')).textContent).toBe(MENSAJES.MEMBER_HAS_PENDING_FINE)

    // Paying the fine clears it.
    await ir(/^Multas$/)
    const fila = (await screen.findByText('S/ 5.00')).closest('tr') as HTMLElement
    await userEvent.click(within(fila).getByRole('button', { name: 'Pagar' }))
    expect(await screen.findByText('Pagada el 21/10/2026')).toBeTruthy()
  })
})
