// @vitest-environment jsdom
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { MENSAJES } from './api/errores.ts'
import { BIBLIOTECARIA, crearApiEnMemoria } from './pruebas/apiEnMemoria.ts'
import { salirDelPanel } from './pruebas/menu.ts'
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
    renderizar(<App />, { api: memoria.api, ruta: '/', sesion: null })

    // Nobody is signed in: the panel asks for the credentials of the librarian, who lands in the catalog.
    await escribir('Correo', BIBLIOTECARIA.email)
    await escribir('Contraseña', BIBLIOTECARIA.password)
    await pulsar('Entrar')

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

    // Signing out ends the session: the panel asks again for the credentials.
    await salirDelPanel()
    expect(await screen.findByLabelText('Correo')).toBeTruthy()
  }, 20_000)

  it('lets a member sign in, see the catalog and their own account, and nothing of anyone else', async () => {
    const memoria = crearApiEnMemoria()
    const libro = await memoria.api.libros.crear({ isbn: '9780306406157', titulo: 'El Faro Imaginado', autor: 'Autora Ficticia' })
    const ejemplar = await memoria.api.ejemplares.crear(libro.id, 'EJ-1')
    const rosa = await memoria.api.socios.crear({ nombre: 'Rosa Ficticia', email: 'rosa@example.org' })
    const mateo = await memoria.api.socios.crear({ nombre: 'Mateo Quispe', email: 'mateo@example.org' })
    memoria.abrirCuenta(rosa.id, 'rosa@example.org', 'una-contrasena-larga')
    await memoria.api.prestamos.crear(rosa.id, ejemplar.id)
    const otro = await memoria.api.ejemplares.crear(libro.id, 'EJ-2')
    await memoria.api.prestamos.crear(mateo.id, otro.id)
    memoria.envejecerPrestamos(19)
    renderizar(<App />, { api: memoria.api, ruta: '/socios', sesion: null })

    // The member asked for a librarian screen before signing in; after it, they land in their own account, not on a refusal.
    await escribir('Correo', 'rosa@example.org')
    await escribir('Contraseña', 'una-contrasena-larga')
    await pulsar('Entrar')
    expect(await screen.findByRole('heading', { name: 'Mi cuenta' })).toBeTruthy()

    // Their own account shows their loan, overdue, and only theirs.
    expect(await screen.findByText('Vencido (5 d)')).toBeTruthy()
    expect(screen.getAllByText(/Préstamo #/)).toHaveLength(1)
    expect(screen.queryByText('Mateo Quispe')).toBeNull()

    // The catalog is there to read.
    await ir(/^Libros$/)
    expect(await screen.findByRole('link', { name: 'El Faro Imaginado' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Nuevo libro' })).toBeNull()
  }, 20_000)
})
