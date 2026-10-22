const TRAZOS = {
  menu: 'M4 6h16M4 12h16M4 18h16',
  chevron: 'M6 9l6 6 6-6',
  inicio: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  libros: 'M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5C4.7 19 4 18.3 4 17.5v-12zM20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5-.7 1.5-1.5v-12z',
  socios: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 19c0-3 2.7-5 6-5s6 2 6 5M16 14c2.8.2 5 2 5 5M16 5.2a3 3 0 010 5.6',
  prestamos: 'M4 8h14l-3-3M20 16H6l3 3',
  multas: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  cuenta: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 13a3 3 0 100-6 3 3 0 000 6zM6.5 18.5c1-2.5 3-3.5 5.5-3.5s4.5 1 5.5 3.5',
  sol: 'M12 16a4 4 0 100-8 4 4 0 000 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  luna: 'M20 14.5A8 8 0 119.5 4 6.5 6.5 0 0020 14.5z',
  salir: 'M10 4H5v16h5M15 8l4 4-4 4M19 12H9',
  bien: 'M5 12l4 4 10-10',
  reloj: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
  alerta: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 8v5M12 16v.5',
  neutro: 'M6 12h12',
} as const

export type NombreDeIcono = keyof typeof TRAZOS

/** A small outline icon that takes the color of the text around it. Always decorative: the words carry the meaning. */
export function Icono({ nombre, tamano = 18 }: { nombre: NombreDeIcono; tamano?: number }) {
  return (
    <svg
      className="icono"
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={TRAZOS[nombre]} />
    </svg>
  )
}
