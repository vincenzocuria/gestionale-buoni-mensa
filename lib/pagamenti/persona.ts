import type { AnalisiAudit } from "@/lib/audit/tipi"
import type { RigaElenco } from "@/lib/pagamenti/tipi"
import { compattaElenco, dataPiuRecente, type VoceElenco } from "@/lib/pagamenti/voci"

export function chiavePersona(riga: { codiceFiscale: string; debitore: string }): string {
  const fiscale = riga.codiceFiscale.trim().toUpperCase()
  return fiscale || `deb:${riga.debitore.trim().toUpperCase()}`
}

export function chiavePersonaAnno(riga: {
  codiceFiscale: string
  debitore: string
  annoScolastico: string
}): string {
  return `${riga.annoScolastico}|${chiavePersona(riga)}`
}

export function chiaveVoce(voce: VoceElenco): string {
  if (voce.tipo === "singola") return chiavePersonaAnno(voce.riga)
  const riga = voce.righe[0]
  if (riga) return chiavePersonaAnno(riga)
  return `${voce.gruppo.annoScolastico}|deb:${voce.gruppo.debitore.trim().toUpperCase()}`
}

export type SchedaPersona = {
  chiave: string
  debitore: string
  codiceFiscale: string
  annoScolastico: string
  voci: VoceElenco[]
  dovuti: number
  consegnati: number
  daConsegnare: number
}

export function schedaPersona(
  righe: RigaElenco[],
  analisi: AnalisiAudit,
  chiave: string,
): SchedaPersona | null {
  const proprie = righe.filter((riga) => chiavePersonaAnno(riga) === chiave)
  if (proprie.length === 0) return null
  const voci = [...compattaElenco(proprie, analisi)].sort((a, b) => dataVoce(b).localeCompare(dataVoce(a)))
  const conti = contaBlocchetti(voci, analisi)
  return {
    chiave,
    debitore: debitoreScheda(proprie),
    codiceFiscale: proprie.find((riga) => riga.codiceFiscale.trim())?.codiceFiscale.trim() ?? "",
    annoScolastico: proprie[0].annoScolastico,
    voci,
    dovuti: conti.dovuti,
    consegnati: conti.consegnati,
    daConsegnare: conti.dovuti - conti.consegnati,
  }
}

function contaBlocchetti(voci: VoceElenco[], analisi: AnalisiAudit): { dovuti: number; consegnati: number } {
  let dovuti = 0
  let consegnati = 0
  for (const voce of voci) {
    if (voce.tipo === "singola") {
      if (analisi.perIuv.get(voce.riga.iuv)?.esito !== "valido") continue
      const n = voce.riga.blocchettiDovuti
      dovuti += n
      consegnati += Math.min(n, voce.riga.blocchettiConsegnati)
      continue
    }
    if (voce.gruppo.esito !== "accorpato") continue
    dovuti += voce.gruppo.blocchetti
    consegnati += voce.gruppo.consegnati
  }
  return { dovuti, consegnati }
}

function dataVoce(voce: VoceElenco): string {
  if (voce.tipo === "singola") return voce.riga.dataPagamento ?? voce.riga.dataScadenza ?? ""
  return dataPiuRecente(voce.righe.map((riga) => riga.dataPagamento)) ?? ""
}

function debitoreScheda(righe: RigaElenco[]): string {
  const ordinati = [...righe].sort((a, b) => (b.dataPagamento ?? "").localeCompare(a.dataPagamento ?? ""))
  return ordinati.find((riga) => riga.debitore.trim())?.debitore ?? ""
}
