export const PRIMO_ANNO_SCOLASTICO = 2026

export type AnnoScolastico = {
  inizio: number
  etichetta: string
}

type DateRiga = {
  dataScadenza: string | null
  dataEmissione: string | null
  dataPagamento: string | null
}

export function annoScolasticoDaIso(iso: string | null | undefined): AnnoScolastico | null {
  if (!iso) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!match) return null
  const anno = Number(match[1])
  const mese = Number(match[2])
  const giorno = Number(match[3])
  if (mese < 1 || mese > 12 || giorno < 1 || giorno > 31) return null
  const inizio = mese >= 9 ? anno : anno - 1
  return { inizio, etichetta: `${inizio}/${inizio + 1}` }
}

export function dataAnnoScolastico(riga: DateRiga): string | null {
  return riga.dataScadenza ?? riga.dataEmissione ?? riga.dataPagamento
}

export function etichettaImportabile(riga: DateRiga): string | null {
  const anno = annoScolasticoDaIso(dataAnnoScolastico(riga))
  if (!anno || anno.inizio < PRIMO_ANNO_SCOLASTICO) return null
  return anno.etichetta
}

export function eAnnoImportato(etichetta: string): boolean {
  const match = /^(\d{4})\/(\d{4})$/.exec(etichetta)
  if (!match) return false
  const inizio = Number(match[1])
  return inizio >= PRIMO_ANNO_SCOLASTICO && Number(match[2]) === inizio + 1
}

export function righeDellAnno<T extends { annoScolastico: string }>(righe: T[], etichetta: string): T[] {
  return righe.filter((riga) => riga.annoScolastico === etichetta)
}

export function anniSelezionabili(etichette: string[], oggi = new Date()): string[] {
  const presenti = [...new Set(etichette.filter(eAnnoImportato))]
  const corrente = annoScolasticoDaIso(isoLocale(oggi))
  if (corrente && corrente.inizio >= PRIMO_ANNO_SCOLASTICO) presenti.push(corrente.etichetta)
  else presenti.push(`${PRIMO_ANNO_SCOLASTICO}/${PRIMO_ANNO_SCOLASTICO + 1}`)
  return [...new Set(presenti)].sort()
}

export function annoPredefinito(anni: string[], oggi = new Date()): string {
  const corrente = annoScolasticoDaIso(isoLocale(oggi))
  if (corrente && anni.includes(corrente.etichetta)) return corrente.etichetta
  return anni[0] ?? `${PRIMO_ANNO_SCOLASTICO}/${PRIMO_ANNO_SCOLASTICO + 1}`
}

function isoLocale(data: Date): string {
  const mese = String(data.getMonth() + 1).padStart(2, "0")
  const giorno = String(data.getDate()).padStart(2, "0")
  return `${data.getFullYear()}-${mese}-${giorno}`
}
