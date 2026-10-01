export const PER_PAGINA = 25

export function slicePagina<T>(righe: T[], pagina: number, perPagina = PER_PAGINA): {
  voci: T[]
  pagina: number
  pagine: number
  dal: number
  al: number
} {
  const pagine = Math.max(1, Math.ceil(righe.length / perPagina))
  const corrente = Math.min(Math.max(1, pagina), pagine)
  const inizio = (corrente - 1) * perPagina
  const voci = righe.slice(inizio, inizio + perPagina)
  return {
    voci,
    pagina: corrente,
    pagine,
    dal: righe.length === 0 ? 0 : inizio + 1,
    al: inizio + voci.length,
  }
}
