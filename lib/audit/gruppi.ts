import { allineaConsegne } from "@/lib/consegna/tempi"
import { formatEuro } from "@/lib/format/euro"
import { CENTESIMI_BLOCCHETTO, eImportoBlocchetto, numeroBlocchetti } from "@/lib/blocchetti/tariffa"
import type { AnalisiAudit, EsitoAuditRiga, GruppoAudit, RigaAudit } from "@/lib/audit/tipi"
import { chiavePersonaAnno } from "@/lib/pagamenti/persona"

export function analizzaBlocchetti(righe: RigaAudit[]): AnalisiAudit {
  const perIuv = new Map<string, { esito: EsitoAuditRiga; testo: string; gruppoId: string | null }>()
  const perPersona = new Map<string, RigaAudit[]>()

  for (const riga of righe) {
    if (!riga.dataPagamento) {
      perIuv.set(riga.iuv, { esito: "non_pagato", testo: "", gruppoId: null })
      continue
    }
    if (eImportoBlocchetto(riga.importoCentesimi)) {
      const n = numeroBlocchetti(riga.importoCentesimi)
      perIuv.set(riga.iuv, {
        esito: "valido",
        testo: n === 1 ? "1 blocchetto da 40 €" : `${n} blocchetti da 40 €`,
        gruppoId: null,
      })
      continue
    }
    const lista = perPersona.get(chiave(riga)) ?? []
    lista.push(riga)
    perPersona.set(chiave(riga), lista)
  }

  const gruppi: GruppoAudit[] = []
  for (const voce of perPersona.values()) {
    gruppi.push(...classifica(voce))
  }
  gruppi.sort((a, b) => a.debitore.localeCompare(b.debitore, "it") || a.esito.localeCompare(b.esito))

  for (const gruppo of gruppi) {
    for (const pagamento of gruppo.pagamenti) {
      perIuv.set(pagamento.iuv, { esito: gruppo.esito, testo: gruppo.testo, gruppoId: gruppo.id })
    }
  }

  return { gruppi, perIuv }
}

export function pianoConsegnaGruppo(
  gruppo: GruppoAudit,
  azione: "completa" | "parziale" | "annulla",
  adesso: string,
): { iuv: string; consegnati: number; consegneIl: string[] }[] {
  const n = gruppo.blocchetti
  const usato = Math.min(n, gruppo.pagamenti.reduce((somma, riga) => somma + riga.blocchettiConsegnati, 0))
  let prossimo = usato
  if (azione === "completa") prossimo = n
  else if (azione === "annulla") prossimo = 0
  else prossimo = Math.min(n, usato + 1)
  return gruppo.pagamenti.map((pagamento, indice) => {
    const consegnati = indice === 0 ? prossimo : 0
    return {
      iuv: pagamento.iuv,
      consegnati,
      consegneIl: allineaConsegne(indice === 0 ? (pagamento.consegneIl ?? []) : [], consegnati, adesso),
    }
  })
}

function classifica(voci: RigaAudit[]): GruppoAudit[] {
  const aperti = [...voci]
  const gruppi: GruppoAudit[] = []
  while (aperti.length > 0) {
    const preso = migliorSottoinsieme(aperti)
    if (!preso) break
    gruppi.push(gruppo(preso, "accorpato"))
    const usati = new Set(preso.map((riga) => riga.iuv))
    for (let i = aperti.length - 1; i >= 0; i--) {
      if (usati.has(aperti[i].iuv)) aperti.splice(i, 1)
    }
  }
  if (aperti.length > 0) gruppi.push(gruppo(aperti, "anomalia"))
  return gruppi
}

function migliorSottoinsieme(voci: RigaAudit[]): RigaAudit[] | null {
  const n = voci.length
  if (n > 16) {
    const somma = voci.reduce((totale, riga) => totale + riga.importoCentesimi, 0)
    return somma > 0 && somma % CENTESIMI_BLOCCHETTO === 0 ? voci : null
  }
  let best: RigaAudit[] | null = null
  let bestSum = 0
  for (let mask = 1; mask < 1 << n; mask++) {
    let somma = 0
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) somma += voci[i].importoCentesimi
    }
    if (somma <= 0 || somma % CENTESIMI_BLOCCHETTO !== 0 || somma <= bestSum) continue
    bestSum = somma
    best = voci.filter((_, indice) => (mask & (1 << indice)) !== 0)
  }
  return best
}

function gruppo(pagamenti: RigaAudit[], esito: "accorpato" | "anomalia"): GruppoAudit {
  const sommaCentesimi = pagamenti.reduce((somma, riga) => somma + riga.importoCentesimi, 0)
  const blocchetti = esito === "accorpato" ? numeroBlocchetti(sommaCentesimi) : 0
  const consegnati = Math.min(
    blocchetti,
    pagamenti.reduce((somma, riga) => somma + riga.blocchettiConsegnati, 0),
  )
  const pezzi = pagamenti.map((riga) => `${formatEuro(riga.importoCentesimi)} (IUV ${riga.iuv})`).join(" + ")
  const testo =
    esito === "accorpato"
      ? `${pezzi} = ${formatEuro(sommaCentesimi)} · ${blocchetti} ${blocchetti === 1 ? "blocchetto" : "blocchetti"}`
      : pagamenti.length === 1
        ? `${formatEuro(sommaCentesimi)} non è un multiplo di 40 €`
        : `${pezzi} = ${formatEuro(sommaCentesimi)}, non quadra con i blocchetti da 40 €`
  return {
    id: pagamenti.map((riga) => riga.iuv).sort().join("+"),
    annoScolastico: pagamenti[0].annoScolastico,
    debitore: pagamenti[0].debitore,
    esito,
    pagamenti,
    sommaCentesimi,
    blocchetti,
    consegnati,
    testo,
  }
}

function chiave(riga: RigaAudit): string {
  return chiavePersonaAnno(riga)
}
