import type { AnalisiAudit, GruppoAudit } from "@/lib/audit/tipi"
import type { FiltroElenco, RigaElenco, StatoPagamento } from "@/lib/pagamenti/tipi"

export type VoceElenco =
  | { tipo: "singola"; id: string; riga: RigaElenco }
  | { tipo: "gruppo"; id: string; gruppo: GruppoAudit; righe: RigaElenco[] }

export function compattaElenco(righe: RigaElenco[], analisi: AnalisiAudit): VoceElenco[] {
  const viste = new Map(righe.map((riga) => [riga.iuv, riga]))
  const emessi = new Set<string>()
  const voci: VoceElenco[] = []

  for (const riga of righe) {
    const gruppoId = analisi.perIuv.get(riga.iuv)?.gruppoId
    if (!gruppoId) {
      voci.push({ tipo: "singola", id: riga.iuv, riga })
      continue
    }
    if (emessi.has(gruppoId)) continue
    emessi.add(gruppoId)
    const gruppo = analisi.gruppi.find((voce) => voce.id === gruppoId)
    if (!gruppo) {
      voci.push({ tipo: "singola", id: riga.iuv, riga })
      continue
    }
    const membri = gruppo.pagamenti
      .map((pagamento) => viste.get(pagamento.iuv))
      .filter((membro): membro is RigaElenco => membro != null)
    voci.push({ tipo: "gruppo", id: gruppo.id, gruppo, righe: membri.length > 0 ? membri : [riga] })
  }

  return voci
}

export function filtraVoci(voci: VoceElenco[], filtro: FiltroElenco, ricerca: string): VoceElenco[] {
  const ago = ricerca.trim().toLowerCase().replace(/^'+/, "")
  return voci.filter((voce) => corrispondeFiltro(voce, filtro) && corrispondeRicerca(voce, ago))
}

export function contaFiltri(voci: VoceElenco[], ricerca: string): Record<FiltroElenco, number> {
  return {
    tutti: filtraVoci(voci, "tutti", ricerca).length,
    paganti: filtraVoci(voci, "paganti", ricerca).length,
    non_paganti: filtraVoci(voci, "non_paganti", ricerca).length,
    da_consegnare: filtraVoci(voci, "da_consegnare", ricerca).length,
    consegnati: filtraVoci(voci, "consegnati", ricerca).length,
  }
}

export function statoVoce(voce: VoceElenco): StatoPagamento {
  return voce.tipo === "singola" ? voce.riga.stato : statoGruppo(voce.gruppo)
}

export function statoGruppo(gruppo: GruppoAudit): StatoPagamento {
  if (gruppo.esito === "accorpato" && gruppo.blocchetti > 0 && gruppo.consegnati >= gruppo.blocchetti) {
    return "consegnato"
  }
  if (gruppo.pagamenti.every((pagamento) => !pagamento.dataPagamento)) return "non_pagato"
  return "da_consegnare"
}

export function dataPiuRecente(date: (string | null)[]): string | null {
  const valide = date.filter((data): data is string => Boolean(data))
  if (valide.length === 0) return null
  return valide.reduce((scelta, data) => (data > scelta ? data : scelta))
}

function corrispondeFiltro(voce: VoceElenco, filtro: FiltroElenco): boolean {
  if (filtro === "tutti") return true
  const stato = statoVoce(voce)
  if (filtro === "paganti") return stato !== "non_pagato"
  if (filtro === "non_paganti") return stato === "non_pagato"
  if (filtro === "da_consegnare") return stato === "da_consegnare"
  return stato === "consegnato"
}

function corrispondeRicerca(voce: VoceElenco, ago: string): boolean {
  if (!ago) return true
  const campi =
    voce.tipo === "singola"
      ? [voce.riga.cognome, voce.riga.nome, voce.riga.debitore, voce.riga.codiceFiscale, voce.riga.iuv]
      : [
          voce.gruppo.debitore,
          ...voce.righe.flatMap((riga) => [riga.cognome, riga.nome, riga.debitore, riga.codiceFiscale, riga.iuv]),
        ]
  return campi.some((campo) => campo.toLowerCase().includes(ago))
}
