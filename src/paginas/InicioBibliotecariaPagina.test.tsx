// @vitest-environment jsdom
import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Panel } from '../api/cliente.ts'
import { renderizar } from '../pruebas/renderizar.ts'
import { InicioBibliotecariaPagina } from './InicioBibliotecariaPagina.tsx'

function panel(extra: Partial<Panel> = {}): Panel {
  return {
    fecha: '2026-10-22',
    prestamos: { activos: 18, vencidos: 3, porVencer: 5, diasPorVencer: 7 },
    ejemplaresActivos: 20,
    sociosActivos: 8,
    multas: { pendientes: 2, montoPendiente: 19, sociosConMultaPendiente: 1 },
    prestamosPorSemana: [
      { semana: '2026-09-14', prestamos: 4 },
      { semana: '2026-09-21', prestamos: 9 },
      { semana: '2026-09-28', prestamos: 12 },
      { semana: '2026-10-05', prestamos: 7 },
      { semana: '2026-10-12', prestamos: 15 },
      { semana: '2026-10-19', prestamos: 6 },
    ],
    masPrestados: [
      { libroId: 4, titulo: 'El Faro Imaginado', prestamos: 9 },
      { libroId: 7, titulo: 'Cartografía de la Niebla', prestamos: 5 },
    ],
    requierenAtencion: [
      {
        prestamoId: 11, socioId: 3, nombreSocio: 'Rosa Valdivia', tituloLibro: 'La Biblioteca de Arena', codigoEjemplar: 'EJ-004',
        fechaVencimiento: '2026-10-18', diasRetraso: 4, alerta: 'OVERDUE',
      },
      {
        prestamoId: 12, socioId: 5, nombreSocio: 'Andrés Paredes', tituloLibro: 'El Faro Imaginado', codigoEjemplar: 'EJ-001',
        fechaVencimiento: '2026-10-24', diasRetraso: 0, alerta: 'DUE_SOON',
      },
    ],
    ...extra,
  }
}

function inicio(datos: Panel) {
  const resumen = vi.fn().mockResolvedValue(datos)
  renderizar(<InicioBibliotecariaPagina />, { api: { panel: { resumen } } })
  return { resumen }
}

const cifra = (titulo: RegExp) => screen.getByRole('link', { name: titulo })

describe('InicioBibliotecariaPagina', () => {
  it('shows the four figures, each a link to the list it counts', async () => {
    inicio(panel())

    expect(await screen.findByText('La biblioteca al 22/10/2026.')).toBeTruthy()
    expect(cifra(/Préstamos activos/).textContent).toContain('18')
    expect(cifra(/Préstamos activos/).textContent).toContain('de 20 ejemplares')
    expect(cifra(/Vencidos/).textContent).toContain('3')
    expect(cifra(/Vencen en 7 días/).textContent).toContain('5')
    expect(cifra(/Multas pendientes/).textContent).toContain('S/ 19.00 · 1 socio')
    expect(cifra(/Préstamos activos/).getAttribute('href')).toBe('/prestamos?estado=activos')
    expect(cifra(/Multas pendientes/).getAttribute('href')).toBe('/multas?estado=PENDING')
  })

  it('says what each figure asks of the librarian, in words', async () => {
    inicio(panel())

    await screen.findByText('La biblioteca al 22/10/2026.')
    expect(within(cifra(/Vencidos/)).getByText('Atender')).toBeTruthy()
    expect(within(cifra(/Vencen en 7 días/)).getByText('Avisar')).toBeTruthy()
    expect(within(cifra(/Multas pendientes/)).getByText('Cobrar')).toBeTruthy()
  })

  it('says all is well when there is nothing overdue, due soon or owed', async () => {
    inicio(panel({ prestamos: { activos: 4, vencidos: 0, porVencer: 0, diasPorVencer: 7 }, multas: { pendientes: 0, montoPendiente: 0, sociosConMultaPendiente: 0 }, requierenAtencion: [] }))

    await screen.findByText('La biblioteca al 22/10/2026.')
    expect(within(cifra(/Vencidos/)).getByText('Al día')).toBeTruthy()
    expect(within(cifra(/Vencen en 7 días/)).getByText('Sin pendientes')).toBeTruthy()
    expect(within(cifra(/Multas pendientes/)).getByText('Sin deudas')).toBeTruthy()
    expect(cifra(/Multas pendientes/).textContent).toContain('S/ 0.00 · 0 socios')
    expect(screen.getByText('Nada urgente: no hay préstamos vencidos ni por vencer.')).toBeTruthy()
  })

  it('uses the window the API reports in the title of the soon-to-be-due figure', async () => {
    inicio(panel({ prestamos: { activos: 4, vencidos: 0, porVencer: 2, diasPorVencer: 10 } }))

    expect(await screen.findByRole('link', { name: /Vencen en 10 días/ })).toBeTruthy()
  })

  it('draws the loans of each week with the date the week starts on', async () => {
    inicio(panel())

    const semanas = await screen.findByRole('list', { name: 'Préstamos por semana' })
    const filas = within(semanas).getAllByRole('listitem')
    expect(filas).toHaveLength(6)
    expect(filas[0].textContent).toBe('Desde el 14 sep4')
    expect(filas[4].textContent).toBe('Desde el 12 oct15')
    expect(filas[5].textContent).toBe('Desde el 19 oct6')
  })

  it('ranks the most borrowed books, each a link to the book', async () => {
    inicio(panel())

    const ranking = await screen.findByRole('list', { name: 'Libros más prestados' })
    expect(within(ranking).getAllByRole('listitem').map((fila) => fila.textContent)).toEqual(['El Faro Imaginado9', 'Cartografía de la Niebla5'])
    expect(within(ranking).getByRole('link', { name: 'El Faro Imaginado' }).getAttribute('href')).toBe('/libros/4')
  })

  it('says so when no book has been lent yet', async () => {
    inicio(panel({ masPrestados: [] }))

    expect(await screen.findByText('Todavía no hay préstamos que contar.')).toBeTruthy()
    expect(screen.queryByRole('list', { name: 'Libros más prestados' })).toBeNull()
  })

  it('lists the loans that need attention, each with its member, book, state and a link to the loan', async () => {
    inicio(panel())

    const seccion = (await screen.findByRole('heading', { name: 'Requieren atención' })).closest('section') as HTMLElement
    const filas = within(seccion).getAllByRole('listitem')
    expect(filas).toHaveLength(2)

    expect(within(filas[0]).getByRole('link', { name: 'Rosa Valdivia' }).getAttribute('href')).toBe('/socios/3')
    expect(filas[0].textContent).toContain('La Biblioteca de Arena · ejemplar EJ-004 · venció el 18/10/2026')
    expect(within(filas[0]).getByText('Vencido (4 d)').closest('.estado')?.classList.contains('estado-error')).toBe(true)
    expect(within(filas[0]).getByRole('link', { name: 'Ver préstamo #11' }).getAttribute('href')).toBe('/prestamos/11')

    expect(filas[1].textContent).toContain('vence el 24/10/2026')
    expect(within(filas[1]).getByText('Vence pronto').closest('.estado')?.classList.contains('estado-aviso')).toBe(true)
  })

  it('writes a single member in the singular', async () => {
    inicio(panel({ multas: { pendientes: 1, montoPendiente: 5, sociosConMultaPendiente: 1 } }))

    await screen.findByText('La biblioteca al 22/10/2026.')
    expect(cifra(/Multas pendientes/).textContent).toContain('S/ 5.00 · 1 socio')
    expect(cifra(/Multas pendientes/).textContent).not.toContain('socios')
  })

  it('asks the API once and shows the error with a retry when it cannot answer', async () => {
    const resumen = vi.fn().mockRejectedValue(new Error('boom'))
    renderizar(<InicioBibliotecariaPagina />, { api: { panel: { resumen } } })

    expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeTruthy()
    expect(resumen).toHaveBeenCalledTimes(1)
  })
})
