import type { AzioneConsegna } from "@/lib/pagamenti/tipi"

const AZIONI: AzioneConsegna[] = ["completa", "parziale", "annulla", "modifica", "rimuovi", "registra"]

export type CorpoConsegna = {
  azione: AzioneConsegna
  indice: number | null
  quando: string | null
}

export function leggiCorpoConsegna(corpo: unknown): CorpoConsegna | null {
  if (!corpo || typeof corpo !== "object") return null
  const record = corpo as Record<string, unknown>
  const azione = record.azione
  if (typeof azione !== "string" || !AZIONI.includes(azione as AzioneConsegna)) return null
  let indice: number | null = null
  if (record.indice != null) {
    if (typeof record.indice !== "number" || !Number.isInteger(record.indice)) return null
    indice = record.indice
  }
  let quando: string | null = null
  if (record.quando != null) {
    if (typeof record.quando !== "string") return null
    quando = record.quando
  }
  return { azione: azione as AzioneConsegna, indice, quando }
}
