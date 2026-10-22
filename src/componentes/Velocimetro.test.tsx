// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Velocimetro } from './Velocimetro.tsx'
import type { Zona } from './zonas.ts'

afterEach(cleanup)

const ZONAS: Zona[] = [
  { desde: 0, tono: 'error', etiqueta: 'Bloqueado' },
  { desde: 50, tono: 'aviso', etiqueta: 'En riesgo' },
  { desde: 80, tono: 'ok', etiqueta: 'Bueno' },
]

describe('Velocimetro', () => {
  it('says its title, the number and the zone in words', () => {
    render(<Velocimetro titulo="Tu puntaje" valor={79} maximo={100} zonas={ZONAS} />)

    expect(screen.getByText('Tu puntaje')).toBeTruthy()
    expect(screen.getByText('79')).toBeTruthy()
    expect(screen.getByText(/de 100/)).toBeTruthy()
    expect(screen.getByText('En riesgo')).toBeTruthy()
  })

  it.each([
    [10, 'Bloqueado', 'estado-error'],
    [60, 'En riesgo', 'estado-aviso'],
    [95, 'Bueno', 'estado-ok'],
  ])('with %i the label is "%s" and wears the %s tone', (valor, etiqueta, clase) => {
    const { container } = render(<Velocimetro titulo="Tu puntaje" valor={valor} maximo={100} zonas={ZONAS} />)

    expect(screen.getByText(etiqueta).closest('.estado')?.classList.contains(clase)).toBe(true)
    expect(container.querySelectorAll('.estado')).toHaveLength(1)
  })

  it('draws one arc per zone and keeps the drawing out of the reading order, since the words say it all', () => {
    const { container } = render(<Velocimetro titulo="Tu puntaje" valor={79} maximo={100} zonas={ZONAS} />)

    const dibujo = container.querySelector('svg') as SVGElement
    expect(dibujo.getAttribute('aria-hidden')).toBe('true')
    expect(dibujo.querySelectorAll('path.zona')).toHaveLength(3)
    expect([...dibujo.querySelectorAll('path.zona')].map((arco) => arco.getAttribute('class'))).toEqual(['zona zona-error', 'zona zona-aviso', 'zona zona-ok'])
  })

  it('points the needle further right as the value grows', () => {
    const extremoX = (valor: number) => {
      const { container, unmount } = render(<Velocimetro titulo="Tu puntaje" valor={valor} maximo={100} zonas={ZONAS} />)
      const x = Number(container.querySelector('line.aguja')?.getAttribute('x2'))
      unmount()
      return x
    }

    expect(extremoX(0)).toBeLessThan(extremoX(50))
    expect(extremoX(50)).toBeLessThan(extremoX(100))
    expect(extremoX(0)).toBeLessThan(100)
    expect(extremoX(100)).toBeGreaterThan(100)
  })

  it('keeps the needle on the scale when the value is out of range', () => {
    const extremo = (valor: number) => {
      const { container, unmount } = render(<Velocimetro titulo="Tu puntaje" valor={valor} maximo={100} zonas={ZONAS} />)
      const aguja = container.querySelector('line.aguja')
      const punto = [aguja?.getAttribute('x2'), aguja?.getAttribute('y2')]
      unmount()
      return punto
    }

    expect(extremo(250)).toEqual(extremo(100))
    expect(extremo(-5)).toEqual(extremo(0))
  })

  it('shows a count in slots: the needle of 5 of 5 sits in the last slot, not at the very end', () => {
    const zonas: Zona[] = [
      { desde: 0, tono: 'ok', etiqueta: 'Puedes pedir más' },
      { desde: 3, tono: 'aviso', etiqueta: 'Te quedan 2' },
      { desde: 5, tono: 'error', etiqueta: 'Límite alcanzado' },
    ]
    const { container } = render(<Velocimetro titulo="Libros en préstamo" valor={5} maximo={5} zonas={zonas} discreto />)

    expect(container.querySelectorAll('path.zona')).toHaveLength(3)
    expect(screen.getByText('Límite alcanzado')).toBeTruthy()
    const x = Number(container.querySelector('line.aguja')?.getAttribute('x2'))
    expect(x).toBeGreaterThan(100)
    expect(x).toBeLessThan(100 + 62)
  })

  it('can say something else next to the number', () => {
    render(<Velocimetro titulo="Tu puntaje" valor={79} maximo={100} zonas={ZONAS} leyenda="Casi perfecto" />)

    expect(screen.getByText('Casi perfecto')).toBeTruthy()
    expect(screen.queryByText('En riesgo')).toBeNull()
  })
})
