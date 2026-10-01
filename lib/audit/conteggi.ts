import { analizzaBlocchetti } from "@/lib/audit/gruppi"
import type { RigaAudit } from "@/lib/audit/tipi"
import { numeroBlocchetti } from "@/lib/blocchetti/tariffa"

export function conteggiBlocchetti(righe: RigaAudit[]): {
  blocchettiDaConsegnare: number
  blocchettiConsegnati: number
} {
  const analisi = analizzaBlocchetti(righe)
  let dovuti = 0
  let consegnati = 0

  for (const riga of righe) {
    const esito = analisi.perIuv.get(riga.iuv)
    if (!esito || esito.esito !== "valido") continue
    const n = numeroBlocchetti(riga.importoCentesimi)
    const fatti = Math.min(n, riga.blocchettiConsegnati)
    dovuti += n
    consegnati += fatti
  }

  for (const gruppo of analisi.gruppi) {
    if (gruppo.esito !== "accorpato") continue
    dovuti += gruppo.blocchetti
    consegnati += gruppo.consegnati
  }

  return {
    blocchettiDaConsegnare: Math.max(0, dovuti - consegnati),
    blocchettiConsegnati: consegnati,
  }
}
