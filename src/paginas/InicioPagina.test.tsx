// @vitest-environment jsdom
import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Prestamo, Usuario } from '../api/cliente.ts'
import { pagina, renderizar } from '../pruebas/renderizar.ts'
import { REGLAS } from '../pruebas/reglas.ts'
import { InicioPagina } from './InicioPagina.tsx'

function usuario(extra: Partial<NonNullable<Usuario['socio']>> = {}, reglas = REGLAS): Usuario {
  return {
    id: 1,
    email: 'mateo@example.org',
    rol: 'MEMBER',
    reglas,
    socio: { id: 7, nombre: 'Mateo Quispe', email: 'mateo@example.org', fechaRegistro: '2026-09-01', activo: true, score: 100, alertas: [], ...extra },
  }
}

function prestamo(id: number, titulo: string, extra: Partial<Prestamo> = {}): Prestamo {
  return {
    id,
    socioId: 7,
    ejemplarId: id + 10,
    codigoEjemplar: `EJ-${id + 10}`,
    tituloLibro: titulo,
    fechaPrestamo: '2026-10-10',
    fechaVencimiento: '2026-10-24',
    fechaDevolucion: null,
    renovaciones: 0,
    activo: true,
    diasRetraso: 0,
    alertas: [],
    multa: null,
    ...extra,
  }
}

function inicio(yo: Usuario, prestamos: Prestamo[]) {
  const misPrestamos = vi.fn().mockResolvedValue(pagina(prestamos))
  renderizar(<InicioPagina />, { api: { cuenta: { yo: vi.fn().mockResolvedValue(yo), misPrestamos } }, sesion: 'MEMBER' })
  return { misPrestamos }
}

const medidor = (titulo: string) => screen.getByText(titulo).closest('figure') as HTMLElement

describe('InicioPagina', () => {
  it('greets the member and shows how they stand: score and loans against the limit', async () => {
    inicio(usuario({ score: 79 }), [prestamo(1, 'El Faro Imaginado'), prestamo(2, 'Cartografía de la Niebla')])

    expect(await screen.findByText('Hola, Mateo Quispe.')).toBeTruthy()
    const puntaje = medidor('Tu puntaje')
    expect(within(puntaje).getByText('79')).toBeTruthy()
    expect(within(puntaje).getByText('En riesgo')).toBeTruthy()
    const libros = await screen.findByText('Libros en préstamo')
    expect(within(libros.closest('figure') as HTMLElement).getByText('2')).toBeTruthy()
    expect(within(libros.closest('figure') as HTMLElement).getByText(/de 5/)).toBeTruthy()
    expect(within(libros.closest('figure') as HTMLElement).getByText('Puedes pedir más')).toBeTruthy()
  })

  it('takes the limits from the API, not from the panel', async () => {
    inicio(usuario({ score: 60 }, { ...REGLAS, maxPrestamosActivos: 2, puntajeMinimo: 70 }), [prestamo(1, 'El Faro Imaginado'), prestamo(2, 'Cartografía de la Niebla')])

    await screen.findByText('Hola, Mateo Quispe.')
    expect(within(medidor('Tu puntaje')).getByText('Bloqueado')).toBeTruthy()
    const libros = (await screen.findByText('Libros en préstamo')).closest('figure') as HTMLElement
    expect(within(libros).getByText(/de 2/)).toBeTruthy()
    expect(within(libros).getByText('Límite alcanzado')).toBeTruthy()
  })

  it('says how many loans are left while there is room', async () => {
    inicio(usuario(), [1, 2, 3, 4].map((n) => prestamo(n, `Libro ${n}`)))

    const libros = (await screen.findByText('Libros en préstamo')).closest('figure') as HTMLElement
    expect(within(libros).getByText('Te queda 1')).toBeTruthy()
  })

  it('names each active loan by its book and copy, with its state', async () => {
    inicio(usuario(), [
      prestamo(1, 'El Faro Imaginado'),
      prestamo(2, 'Cartografía de la Niebla', { alertas: [{ code: 'DUE_SOON', message: 'Due soon.' }] }),
      prestamo(3, 'La Biblioteca de Arena', { diasRetraso: 5, fechaVencimiento: '2026-10-05', alertas: [{ code: 'OVERDUE', message: 'Overdue.' }] }),
    ])

    expect(await screen.findByText('El Faro Imaginado')).toBeTruthy()
    expect(screen.getByText(/Ejemplar EJ-11 · devolver el 24\/10\/2026/)).toBeTruthy()
    expect(screen.getByText('Activo')).toBeTruthy()
    expect(screen.getByText('Vence pronto')).toBeTruthy()
    expect(screen.getByText('Vencido (5 d)')).toBeTruthy()
  })

  it('asks the API only for the active loans of the member', async () => {
    const { misPrestamos } = inicio(usuario(), [])

    await screen.findByText('Hola, Mateo Quispe.')
    expect(misPrestamos).toHaveBeenCalledWith({ activo: true, size: 50 })
  })

  it('invites the member to the catalog when there is nothing on loan', async () => {
    inicio(usuario(), [])

    expect(await screen.findByText(/No tienes préstamos activos/)).toBeTruthy()
    expect(screen.getAllByRole('link', { name: /catálogo/i }).length).toBeGreaterThan(0)
    const libros = (await screen.findByText('Libros en préstamo')).closest('figure') as HTMLElement
    expect(within(libros).getByText('0')).toBeTruthy()
  })

  it('warns, in the second person, of a pending fine and of a low score', async () => {
    inicio(usuario({ score: 40, alertas: [{ code: 'PENDING_FINE', message: 'x' }, { code: 'LOW_SCORE', message: 'y' }] }), [])

    const alertas = await screen.findByRole('list', { name: 'Alertas' })
    expect(within(alertas).getByText(/Tienes una multa pendiente/)).toBeTruthy()
    expect(within(alertas).getByText(/Tu puntaje es bajo/)).toBeTruthy()
  })

  it('warns of an overdue loan even though the member data does not carry that alert', async () => {
    inicio(usuario(), [prestamo(3, 'La Biblioteca de Arena', { diasRetraso: 5, alertas: [{ code: 'OVERDUE', message: 'Overdue.' }] })])

    const alertas = await screen.findByRole('list', { name: 'Alertas' })
    expect(within(alertas).getByText('Tienes un préstamo vencido: devuélvelo cuanto antes.')).toBeTruthy()
  })

  it('does not warn of anything when all is well', async () => {
    inicio(usuario(), [prestamo(1, 'El Faro Imaginado')])

    await screen.findByText('Hola, Mateo Quispe.')
    expect(screen.queryByRole('list', { name: 'Alertas' })).toBeNull()
  })

  it('links to the catalog and to the account', async () => {
    inicio(usuario(), [])

    await screen.findByText('Hola, Mateo Quispe.')
    expect(screen.getByRole('link', { name: 'Ver mi cuenta' }).getAttribute('href')).toBe('/cuenta')
    expect(screen.getByRole('link', { name: 'Ver el catálogo' }).getAttribute('href')).toBe('/libros')
  })

  it('shows the error with a retry when the account cannot be read', async () => {
    renderizar(<InicioPagina />, {
      api: { cuenta: { yo: vi.fn().mockRejectedValue(new Error('boom')), misPrestamos: vi.fn().mockResolvedValue(pagina([])) } },
      sesion: 'MEMBER',
    })

    expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeTruthy()
  })
})
