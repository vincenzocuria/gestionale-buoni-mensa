import { isoGiornoItalia } from "@/lib/format/ora-italia"
import type { RigaElenco } from "@/lib/pagamenti/tipi"
import type { VoceElenco } from "@/lib/pagamenti/voci"

export type CampoData = "pagamento" | "scadenza"

export type Periodo = {
  campo: CampoData
  dal: string | null
  al: string | null
}

export const PERIODO_VUOTO: Periodo = { campo: "pagamento", dal: null, al: null }

export type PresetPeriodo = "tutto" | "oggi" | "settimana" | "mese"

export function oggiLocale(adesso = new Date()): string {
  return isoGiornoItalia(adesso)
}

export function giornoIso(valore: string | null): string | null {
  if (!valore) return null
  const giorno = valore.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(giorno) ? giorno : null
}

export function intervalloPreset(preset: Exclude<PresetPeriodo, "tutto">, oggi: string): { dal: string; al: string } {
  if (preset === "oggi") return { dal: oggi, al: oggi }
  if (preset === "mese") {
    const [anno, mese] = oggi.split("-").map(Number)
    const ultimo = new Date(anno, mese, 0).getDate()
    return { dal: `${oggi.slice(0, 7)}-01`, al: `${oggi.slice(0, 7)}-${String(ultimo).padStart(2, "0")}` }
  }
  const data = new Date(`${oggi}T12:00:00`)
  const scarto = data.getDay() === 0 ? -6 : 1 - data.getDay()
  data.setDate(data.getDate() + scarto)
  const dal = formatta(data)
  data.setDate(data.getDate() + 6)
  return { dal, al: formatta(data) }
}

export function presetAttivo(periodo: Periodo, oggi: string): PresetPeriodo | null {
  if (!periodo.dal && !periodo.al) return "tutto"
  for (const preset of ["oggi", "settimana", "mese"] as const) {
    const intervallo = intervalloPreset(preset, oggi)
    if (periodo.dal === intervallo.dal && periodo.al === intervallo.al) return preset
  }
  return null
}

export function applicaPreset(periodo: Periodo, preset: PresetPeriodo, oggi: string): Periodo {
  if (preset === "tutto") return { ...periodo, dal: null, al: null }
  return { ...periodo, ...intervalloPreset(preset, oggi) }
}

export function leggiPeriodo(params: { get(nome: string): string | null }): Periodo {
  const campo = params.get("campo") === "scadenza" ? "scadenza" : "pagamento"
  return { campo, dal: giornoIso(params.get("dal")), al: giornoIso(params.get("al")) }
}

export function filtraPeriodo(voci: VoceElenco[], periodo: Periodo): VoceElenco[] {
  if (!periodo.dal && !periodo.al) return voci
  return voci.filter((voce) => voceNelPeriodo(voce, periodo))
}

export function filtraRighePeriodo(righe: RigaElenco[], periodo: Periodo): RigaElenco[] {
  if (!periodo.dal && !periodo.al) return righe
  return righe.filter((riga) => dataNelPeriodo(dataRiga(riga, periodo.campo), periodo.dal, periodo.al))
}

function voceNelPeriodo(voce: VoceElenco, periodo: Periodo): boolean {
  const righe = voce.tipo === "singola" ? [voce.riga] : voce.righe
  return righe.some((riga) => dataNelPeriodo(dataRiga(riga, periodo.campo), periodo.dal, periodo.al))
}

function dataRiga(riga: RigaElenco, campo: CampoData): string | null {
  return campo === "pagamento" ? riga.dataPagamento : riga.dataScadenza
}

function dataNelPeriodo(valore: string | null, dal: string | null, al: string | null): boolean {
  const giorno = giornoIso(valore)
  if (!giorno) return false
  if (dal && giorno < dal) return false
  if (al && giorno > al) return false
  return true
}

function formatta(data: Date): string {
  const mese = String(data.getMonth() + 1).padStart(2, "0")
  const giorno = String(data.getDate()).padStart(2, "0")
  return `${data.getFullYear()}-${mese}-${giorno}`
}
