import type { GruppoAudit } from "@/lib/audit/tipi"
import { aggiungiIstante, modificaIstante, rimuoviIstante } from "@/lib/consegna/modifica"

export type VocePiano = { iuv: string; consegnati: number; consegneIl: string[] }

export function pianoOrarioGruppo(
  gruppo: GruppoAudit,
  azione: "modifica" | "rimuovi" | "registra",
  indice: number | null,
  quando: string | null,
): { ok: true; piano: VocePiano[] } | { ok: false; messaggio: string } {
  if (gruppo.esito !== "accorpato" || gruppo.pagamenti.length === 0) {
    return { ok: false, messaggio: "Accorpamento non trovato." }
  }
  const tempi = gruppo.pagamenti.flatMap((pagamento) => pagamento.consegneIl ?? [])
  if (azione === "registra") {
    const esito = aggiungiIstante(tempi, quando ?? "", gruppo.blocchetti, gruppo.consegnati)
    if (!esito.ok) return esito
    return { ok: true, piano: piano(gruppo, esito.consegnati, esito.tempi) }
  }
  if (azione === "modifica") {
    const esito = modificaIstante(tempi, indice ?? -1, quando ?? "")
    if (!esito.ok) return esito
    return { ok: true, piano: piano(gruppo, gruppo.consegnati, esito.tempi) }
  }
  const esito = rimuoviIstante(tempi, indice ?? -1, gruppo.consegnati)
  if (!esito.ok) return esito
  return { ok: true, piano: piano(gruppo, esito.consegnati, esito.tempi) }
}

function piano(gruppo: GruppoAudit, consegnati: number, tempi: string[]): VocePiano[] {
  return gruppo.pagamenti.map((pagamento, indice) => ({
    iuv: pagamento.iuv,
    consegnati: indice === 0 ? consegnati : 0,
    consegneIl: indice === 0 ? tempi : [],
  }))
}
