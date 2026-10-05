import { isoOraItalia } from "@/lib/format/ora-italia"

export function formatDataIt(iso: string | null): string {
  if (!iso) return "—"
  const istante = conFuso(iso) ? new Date(iso) : null
  const testo = istante && !Number.isNaN(istante.getTime()) ? isoOraItalia(istante) : iso
  const [data, ora] = testo.split("T")
  const [anno, mese, giorno] = data.split("-")
  if (!anno || !mese || !giorno) return iso
  const base = `${giorno}/${mese}/${anno}`
  if (!ora) return base
  const [ore, minuti] = ora.split(":")
  return `${base} ${ore}:${minuti}`
}

function conFuso(iso: string): boolean {
  return /(?:Z|[+-]\d{2}:\d{2})$/.test(iso.trim())
}
