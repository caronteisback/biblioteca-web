// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Barras } from './Barras.tsx'

afterEach(cleanup)

const ancho = (li: HTMLElement) => Number(li.querySelector('rect.barra-valor')?.getAttribute('width'))

describe('Barras', () => {
  it('reads as a list: each row is its label and its number as real text', () => {
    render(
      <Barras
        nombre="Préstamos por semana"
        barras={[
          { clave: 'a', etiqueta: 'Desde el 5 oct', valor: 9 },
          { clave: 'b', etiqueta: 'Desde el 12 oct', valor: 12 },
        ]}
      />,
    )

    const lista = screen.getByRole('list', { name: 'Préstamos por semana' })
    const filas = within(lista).getAllByRole('listitem')
    expect(filas).toHaveLength(2)
    expect(filas[0].textContent).toBe('Desde el 5 oct9')
    expect(filas[1].textContent).toBe('Desde el 12 oct12')
  })

  it('keeps the drawing out of the reading order', () => {
    const { container } = render(<Barras nombre="Barras" barras={[{ clave: 1, etiqueta: 'Uno', valor: 3 }]} />)

    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('fills the row with the longest bar and sizes the others in proportion', () => {
    render(
      <Barras
        nombre="Barras"
        barras={[
          { clave: 1, etiqueta: 'Corta', valor: 5 },
          { clave: 2, etiqueta: 'Larga', valor: 20 },
          { clave: 3, etiqueta: 'Nula', valor: 0 },
        ]}
      />,
    )

    const [corta, larga, nula] = screen.getAllByRole('listitem')
    expect(ancho(larga)).toBe(100)
    expect(ancho(corta)).toBe(25)
    expect(ancho(nula)).toBe(0)
  })

  it('draws empty bars, not broken ones, when every value is zero', () => {
    render(
      <Barras
        nombre="Barras"
        barras={[
          { clave: 1, etiqueta: 'A', valor: 0 },
          { clave: 2, etiqueta: 'B', valor: 0 },
        ]}
      />,
    )

    for (const fila of screen.getAllByRole('listitem')) expect(ancho(fila)).toBe(0)
  })

  it('accepts a link as a label', () => {
    render(<Barras nombre="Barras" barras={[{ clave: 1, etiqueta: <a href="/libros/4">El Faro Imaginado</a>, valor: 7 }]} />)

    expect(screen.getByRole('link', { name: 'El Faro Imaginado' }).getAttribute('href')).toBe('/libros/4')
  })
})
