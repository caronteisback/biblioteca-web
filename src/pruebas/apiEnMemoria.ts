import type { Alerta, Api, Ejemplar, Libro, Multa, Pagina, Panel, Prestamo, Rol, Socio, Usuario } from '../api/cliente.ts'
import { ApiError } from '../api/errores.ts'
import { obtenerSesion } from '../sesion/estado.ts'
import { REGLAS } from './reglas.ts'

/** The librarian that every in-memory library starts with. */
export const BIBLIOTECARIA = { email: 'bibliotecaria@example.org', password: 'una-contrasena-larga' }

const HOY = '2026-10-21'
const DIAS_DE_PRESTAMO = 14

const sumarDias = (dia: string, dias: number) =>
  new Date(Date.parse(`${dia}T00:00:00Z`) + dias * 86_400_000).toISOString().slice(0, 10)
const diasEntre = (desde: string, hasta: string) => Math.round((Date.parse(hasta) - Date.parse(desde)) / 86_400_000)

function pagina<T>(todos: T[], page = 0, size = 20): Pagina<T> {
  return {
    items: todos.slice(page * size, page * size + size),
    page,
    size,
    totalElements: todos.length,
    totalPages: Math.ceil(todos.length / size),
  }
}

const contiene = (texto: string, q?: string) => !q || texto.toLowerCase().includes(q.toLowerCase())

/**
 * A small library that lives in memory and answers like the API does for the rules a screen can
 * show: the copy must be free, a member with a pending fine cannot borrow, an overdue loan cannot be
 * renewed, a late return creates a fine. It is for tests of whole journeys through the screens; the
 * real rules are the API's and are tested there. `envejecerPrestamos` moves the loans back in time,
 * since the clock of the API is not ours.
 *
 * It also has accounts: a librarian from the start and, with `abrirCuenta`, one account per member. Signing in
 * returns a session as the API would, and the account operations answer for whoever the session says.
 */
export function crearApiEnMemoria() {
  let siguiente = 1
  const nuevoId = () => siguiente++
  const libros: Libro[] = []
  const ejemplares: Ejemplar[] = []
  const socios: (Socio & { _desactivado?: boolean })[] = []
  const prestamos: Prestamo[] = []
  const multas: Multa[] = []

  const buscar = <T extends { id: number }>(lista: T[], id: number, codigo: ConstructorParameters<typeof ApiError>[1]) => {
    const encontrado = lista.find((elemento) => elemento.id === id)
    if (!encontrado) throw new ApiError(404, codigo, null)
    return encontrado
  }
  const refrescarEjemplar = (ejemplar: Ejemplar) => {
    ejemplar.disponible = ejemplar.activo && !prestamos.some((p) => p.ejemplarId === ejemplar.id && p.activo)
  }
  const pendientesDe = (socioId: number) =>
    multas.filter((m) => m.estado === 'PENDING' && prestamos.find((p) => p.id === m.prestamoId)?.socioId === socioId)
  const vista = (prestamo: Prestamo): Prestamo => {
    const retraso = prestamo.activo ? Math.max(0, diasEntre(prestamo.fechaVencimiento, HOY)) : 0
    const alertas: Alerta[] = retraso > 0 ? [{ code: 'OVERDUE', message: 'Overdue.' }] : []
    return { ...prestamo, diasRetraso: retraso, alertas, multa: multas.find((m) => m.prestamoId === prestamo.id) ?? null }
  }
  const vistaSocio = (socio: Socio): Socio => {
    const pendientes = pendientesDe(socio.id)
    const conMulta = multas.filter((m) => prestamos.find((p) => p.id === m.prestamoId)?.socioId === socio.id).length
    return {
      ...socio,
      score: 100 - 15 * conMulta,
      alertas: pendientes.length > 0 ? [{ code: 'PENDING_FINE', message: 'Pending fine.' }] : [],
    }
  }


  const cuentas = new Map<string, { password: string; rol: Rol; socioId: number | null; id: number }>([
    [BIBLIOTECARIA.email, { password: BIBLIOTECARIA.password, rol: 'LIBRARIAN', socioId: null, id: nuevoId() }],
  ])
  const usuarioDe = (email: string): Usuario => {
    const cuenta = cuentas.get(email)
    if (!cuenta) throw new ApiError(401, 'UNAUTHENTICATED', null)
    const socio = cuenta.socioId === null ? null : vistaSocio(buscar(socios, cuenta.socioId, 'MEMBER_NOT_FOUND'))
    return { id: cuenta.id, email, rol: cuenta.rol, socio, reglas: REGLAS }
  }
  const socioDeLaSesion = (): number => {
    const sesion = obtenerSesion()
    if (!sesion) throw new ApiError(401, 'UNAUTHENTICATED', null)
    const cuenta = cuentas.get(sesion.usuario.email)
    if (!cuenta || cuenta.rol !== 'MEMBER' || cuenta.socioId === null) throw new ApiError(403, 'FORBIDDEN', null)
    return cuenta.socioId
  }

  const api = {
    auth: {
      entrar: async (email: string, password: string) => {
        const cuenta = cuentas.get(email.toLowerCase())
        if (!cuenta || cuenta.password !== password) throw new ApiError(401, 'INVALID_CREDENTIALS', null)
        return {
          token: `token-de-${email.toLowerCase()}`,
          tipo: 'Bearer' as const,
          expiraEn: new Date(Date.now() + 3_600_000).toISOString(),
          usuario: usuarioDe(email.toLowerCase()),
        }
      },
    },
    cuenta: {
      yo: async () => {
        const sesion = obtenerSesion()
        if (!sesion) throw new ApiError(401, 'UNAUTHENTICATED', null)
        return usuarioDe(sesion.usuario.email)
      },
      misPrestamos: async ({ activo, page = 0, size = 20 }: { activo?: boolean; page?: number; size?: number } = {}) => {
        const socioId = socioDeLaSesion()
        return pagina(prestamos.filter((p) => p.socioId === socioId && (activo === undefined || p.activo === activo)).map(vista), page, size)
      },
      misMultas: async ({ estado, page = 0, size = 20 }: { estado?: Multa['estado']; page?: number; size?: number } = {}) => {
        const socioId = socioDeLaSesion()
        return pagina(
          multas.filter((m) => (estado === undefined || m.estado === estado) && prestamos.find((p) => p.id === m.prestamoId)?.socioId === socioId),
          page,
          size,
        )
      },
    },
    libros: {
      listar: async ({ q, page = 0, size = 20 }: { q?: string; page?: number; size?: number } = {}) =>
        pagina(libros.filter((l) => contiene(`${l.titulo} ${l.autor}`, q)), page, size),
      obtener: async (id: number) => buscar(libros, id, 'BOOK_NOT_FOUND'),
      crear: async (cuerpo: Omit<Libro, 'id'>) => {
        const isbn = cuerpo.isbn.replace(/[-\s]/g, '')
        if (libros.some((l) => l.isbn === isbn)) throw new ApiError(409, 'DUPLICATE_ISBN', null)
        const libro: Libro = { ...cuerpo, isbn, id: nuevoId() }
        libros.push(libro)
        return libro
      },
      actualizar: async (id: number, cuerpo: Omit<Libro, 'id'>) => Object.assign(buscar(libros, id, 'BOOK_NOT_FOUND'), cuerpo),
      eliminar: async (id: number) => {
        buscar(libros, id, 'BOOK_NOT_FOUND')
        if (ejemplares.some((e) => e.libroId === id)) throw new ApiError(409, 'BOOK_HAS_COPIES', null)
        libros.splice(libros.findIndex((l) => l.id === id), 1)
      },
    },
    ejemplares: {
      listarDeLibro: async (libroId: number, { page = 0, size = 20 } = {}) =>
        pagina(ejemplares.filter((e) => e.libroId === libroId), page, size),
      obtener: async (id: number) => buscar(ejemplares, id, 'COPY_NOT_FOUND'),
      crear: async (libroId: number, codigo: string) => {
        buscar(libros, libroId, 'BOOK_NOT_FOUND')
        if (ejemplares.some((e) => e.codigo === codigo)) throw new ApiError(409, 'DUPLICATE_COPY_CODE', null)
        const ejemplar: Ejemplar = { id: nuevoId(), libroId, codigo, activo: true, disponible: true }
        ejemplares.push(ejemplar)
        return ejemplar
      },
      darDeBaja: async (id: number) => {
        const ejemplar = buscar(ejemplares, id, 'COPY_NOT_FOUND')
        if (!ejemplar.disponible && ejemplar.activo) throw new ApiError(409, 'COPY_HAS_ACTIVE_LOAN', null)
        ejemplar.activo = false
        refrescarEjemplar(ejemplar)
        return ejemplar
      },
      reactivar: async (id: number) => {
        const ejemplar = buscar(ejemplares, id, 'COPY_NOT_FOUND')
        ejemplar.activo = true
        refrescarEjemplar(ejemplar)
        return ejemplar
      },
      eliminar: async (id: number) => {
        buscar(ejemplares, id, 'COPY_NOT_FOUND')
        ejemplares.splice(ejemplares.findIndex((e) => e.id === id), 1)
      },
    },
    socios: {
      listar: async ({ q, page = 0, size = 20 }: { q?: string; page?: number; size?: number } = {}) =>
        pagina(socios.filter((s) => contiene(`${s.nombre} ${s.email}`, q)), page, size),
      obtener: async (id: number) => vistaSocio(buscar(socios, id, 'MEMBER_NOT_FOUND')),
      crear: async (cuerpo: { nombre: string; email: string }) => {
        if (socios.some((s) => s.email === cuerpo.email)) throw new ApiError(409, 'DUPLICATE_EMAIL', null)
        const socio: Socio = { ...cuerpo, id: nuevoId(), activo: true, fechaRegistro: HOY, score: 100, alertas: [] }
        socios.push(socio)
        return vistaSocio(socio)
      },
      actualizar: async (id: number, cuerpo: { nombre: string; email: string }) =>
        vistaSocio(Object.assign(buscar(socios, id, 'MEMBER_NOT_FOUND'), cuerpo)),
      desactivar: async (id: number) => {
        const socio = buscar(socios, id, 'MEMBER_NOT_FOUND')
        if (prestamos.some((p) => p.socioId === id && p.activo)) throw new ApiError(409, 'MEMBER_HAS_ACTIVE_LOANS', null)
        socio.activo = false
        return vistaSocio(socio)
      },
      reactivar: async (id: number) => {
        const socio = buscar(socios, id, 'MEMBER_NOT_FOUND')
        socio.activo = true
        return vistaSocio(socio)
      },
      eliminar: async (id: number) => {
        buscar(socios, id, 'MEMBER_NOT_FOUND')
        if (prestamos.some((p) => p.socioId === id)) throw new ApiError(409, 'MEMBER_HAS_HISTORY', null)
        socios.splice(socios.findIndex((s) => s.id === id), 1)
      },
    },
    panel: {
      /** The figures of the dashboard, worked out from what is in memory the way the API works them out from the database. */
      resumen: async (): Promise<Panel> => {
        const dias = 7
        const activos = prestamos.filter((p) => p.activo).map(vista)
        const pendientes = multas.filter((m) => m.estado === 'PENDING')
        const lunes = (dia: string) => {
          const d = new Date(`${dia}T00:00:00Z`)
          return sumarDias(dia, -((d.getUTCDay() + 6) % 7))
        }
        const primera = sumarDias(lunes(HOY), -35)
        const semanas = Array.from({ length: 6 }, (_, i) => sumarDias(primera, 7 * i))
        const porLibro = new Map<number, number>()
        for (const p of prestamos) {
          const ejemplar = ejemplares.find((e) => e.id === p.ejemplarId)
          if (ejemplar) porLibro.set(ejemplar.libroId, (porLibro.get(ejemplar.libroId) ?? 0) + 1)
        }
        const casos = activos
          .filter((p) => diasEntre(HOY, p.fechaVencimiento) <= dias)
          .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento) || a.id - b.id)
          .slice(0, 5)
        return {
          fecha: HOY,
          prestamos: {
            activos: activos.length,
            vencidos: activos.filter((p) => p.diasRetraso > 0).length,
            porVencer: activos.filter((p) => p.diasRetraso === 0 && diasEntre(HOY, p.fechaVencimiento) <= dias).length,
            diasPorVencer: dias,
          },
          ejemplaresActivos: ejemplares.filter((e) => e.activo).length,
          sociosActivos: socios.filter((s) => s.activo).length,
          multas: {
            pendientes: pendientes.length,
            montoPendiente: pendientes.reduce((suma, m) => suma + m.monto, 0),
            sociosConMultaPendiente: new Set(pendientes.map((m) => prestamos.find((p) => p.id === m.prestamoId)?.socioId)).size,
          },
          prestamosPorSemana: semanas.map((semana) => ({
            semana,
            prestamos: prestamos.filter((p) => lunes(p.fechaPrestamo) === semana).length,
          })),
          masPrestados: [...porLibro.entries()]
            .map(([libroId, cuenta]) => ({ libroId, titulo: libros.find((l) => l.id === libroId)?.titulo ?? '', prestamos: cuenta }))
            .sort((a, b) => b.prestamos - a.prestamos || a.titulo.localeCompare(b.titulo))
            .slice(0, 5),
          requierenAtencion: casos.map((p) => ({
            prestamoId: p.id,
            socioId: p.socioId,
            nombreSocio: socios.find((s) => s.id === p.socioId)?.nombre ?? '',
            tituloLibro: p.tituloLibro,
            codigoEjemplar: p.codigoEjemplar,
            fechaVencimiento: p.fechaVencimiento,
            diasRetraso: p.diasRetraso,
            alerta: p.diasRetraso > 0 ? ('OVERDUE' as const) : ('DUE_SOON' as const),
          })),
        }
      },
    },
    prestamos: {
      listar: async ({ socioId, activo, page = 0, size = 20 }: { socioId?: number; activo?: boolean; page?: number; size?: number } = {}) =>
        pagina(
          prestamos.filter((p) => (socioId === undefined || p.socioId === socioId) && (activo === undefined || p.activo === activo)).map(vista),
          page,
          size,
        ),
      obtener: async (id: number) => vista(buscar(prestamos, id, 'LOAN_NOT_FOUND')),
      crear: async (socioId: number, ejemplarId: number) => {
        const socio = buscar(socios, socioId, 'MEMBER_NOT_FOUND')
        const ejemplar = buscar(ejemplares, ejemplarId, 'COPY_NOT_FOUND')
        if (!socio.activo) throw new ApiError(422, 'MEMBER_INACTIVE', null)
        if (!ejemplar.activo) throw new ApiError(422, 'COPY_INACTIVE', null)
        if (!ejemplar.disponible) throw new ApiError(409, 'COPY_ALREADY_ON_LOAN', null)
        if (pendientesDe(socioId).length > 0) throw new ApiError(422, 'MEMBER_HAS_PENDING_FINE', null)
        const prestamo: Prestamo = {
          id: nuevoId(), socioId, ejemplarId, codigoEjemplar: ejemplar.codigo,
          tituloLibro: libros.find((libro) => libro.id === ejemplar.libroId)?.titulo ?? '', fechaPrestamo: HOY, fechaVencimiento: sumarDias(HOY, DIAS_DE_PRESTAMO),
          fechaDevolucion: null, renovaciones: 0, activo: true, diasRetraso: 0, alertas: [], multa: null,
        }
        prestamos.push(prestamo)
        refrescarEjemplar(ejemplar)
        return vista(prestamo)
      },
      renovar: async (id: number) => {
        const prestamo = buscar(prestamos, id, 'LOAN_NOT_FOUND')
        if (!prestamo.activo) throw new ApiError(409, 'LOAN_ALREADY_RETURNED', null)
        if (vista(prestamo).diasRetraso > 0) throw new ApiError(422, 'RENEWAL_NOT_ALLOWED_OVERDUE', null)
        prestamo.renovaciones += 1
        prestamo.fechaVencimiento = sumarDias(prestamo.fechaVencimiento, DIAS_DE_PRESTAMO)
        return vista(prestamo)
      },
      devolver: async (id: number) => {
        const prestamo = buscar(prestamos, id, 'LOAN_NOT_FOUND')
        if (!prestamo.activo) throw new ApiError(409, 'LOAN_ALREADY_RETURNED', null)
        const retraso = vista(prestamo).diasRetraso
        prestamo.activo = false
        prestamo.fechaDevolucion = HOY
        if (retraso > 0) {
          multas.push({ id: nuevoId(), prestamoId: id, monto: retraso, diasRetraso: retraso, estado: 'PENDING', fechaGeneracion: HOY, fechaPago: null })
        }
        refrescarEjemplar(buscar(ejemplares, prestamo.ejemplarId, 'COPY_NOT_FOUND'))
        return vista(prestamo)
      },
    },
    multas: {
      listar: async ({ socioId, estado, page = 0, size = 20 }: { socioId?: number; estado?: Multa['estado']; page?: number; size?: number } = {}) =>
        pagina(
          multas.filter((m) => (estado === undefined || m.estado === estado) && (socioId === undefined || prestamos.find((p) => p.id === m.prestamoId)?.socioId === socioId)),
          page,
          size,
        ),
      pagar: async (id: number) => {
        const multa = buscar(multas, id, 'FINE_NOT_FOUND')
        if (multa.estado === 'PAID') throw new ApiError(409, 'FINE_ALREADY_PAID', null)
        multa.estado = 'PAID'
        multa.fechaPago = HOY
        return multa
      },
    },
  }

  return {
    api: api as unknown as Api,
    /** Gives a member an account to sign in with. */
    abrirCuenta(socioId: number, email: string, password: string) {
      buscar(socios, socioId, 'MEMBER_NOT_FOUND')
      cuentas.set(email.toLowerCase(), { password, rol: 'MEMBER', socioId, id: nuevoId() })
    },
    /** Moves every active loan back in time, as if that many days had passed since it was made. */
    envejecerPrestamos(dias: number) {
      for (const prestamo of prestamos.filter((p) => p.activo)) {
        prestamo.fechaPrestamo = sumarDias(prestamo.fechaPrestamo, -dias)
        prestamo.fechaVencimiento = sumarDias(prestamo.fechaVencimiento, -dias)
      }
    },
  }
}
