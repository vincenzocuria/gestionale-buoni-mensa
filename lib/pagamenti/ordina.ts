import { dataPiuRecente, statoVoce, type VoceElenco } from "@/lib/pagamenti/voci"
import { ETICHETTA_STATO } from "@/lib/pagamenti/stato"

export type ColonnaElenco = "debitore" | "importo" | "blocchetti" | "pagamento" | "scadenza" | "iuv" | "stato"

export type VersoOrdine = "asc" | "desc"

export type OrdineElenco = {
  colonna: ColonnaElenco
  verso: VersoOrdine
}

export const COLONNE_ELENCO: { id: ColonnaElenco; etichetta: string }[] = [
  { id: "debitore", etichetta: "Debitore" },
  { id: "importo", etichetta: "Importo" },
  { id: "blocchetti", etichetta: "Blocchetti" },
  { id: "pagamento", etichetta: "Pagamento" },
  { id: "scadenza", etichetta: "Scadenza" },
  { id: "iuv", etichetta: "IUV" },
  { id: "stato", etichetta: "Stato" },
]

export function versoIniziale(colonna: ColonnaElenco): VersoOrdine {
  if (colonna === "pagamento" || colonna === "scadenza" || colonna === "importo" || colonna === "blocchetti") {
    return "desc"
  }
  return "asc"
}

export function alternaOrdine(attuale: OrdineElenco | null, colonna: ColonnaElenco): OrdineElenco {
  if (attuale?.colonna === colonna) {
    return { colonna, verso: attuale.verso === "asc" ? "desc" : "asc" }
  }
  return { colonna, verso: versoIniziale(colonna) }
}

// Ordine di partenza della tabella: data di pagamento, dalla più recente.
export const ORDINE_PREDEFINITO: OrdineElenco = { colonna: "pagamento", verso: "desc" }

// I «Da consegnare» stanno sempre in cima (secondo lo stato della voce intera,
// gruppi compresi); dentro ciascuna fascia vale la colonna scelta. A parità si
// usano debitore e IUV, così l'ordine non dipende da come arrivano le righe.
// Solo ordinando per Stato la fascia la decide la colonna stessa.
export function ordinaVoci(voci: VoceElenco[], ordine: OrdineElenco | null): VoceElenco[] {
  const scelto = ordine ?? ORDINE_PREDEFINITO
  return [...voci].sort(
    (a, b) =>
      (scelto.colonna === "stato" ? 0 : fascia(a) - fascia(b)) ||
      confronta(a, b, scelto) ||
      confronta(a, b, { colonna: "debitore", verso: "asc" }) ||
      confronta(a, b, { colonna: "iuv", verso: "asc" }),
  )
}

function fascia(voce: VoceElenco): number {
  return statoVoce(voce) === "da_consegnare" ? 0 : 1
}

function confronta(a: VoceElenco, b: VoceElenco, ordine: OrdineElenco): number {
  const va = chiave(a, ordine.colonna)
  const vb = chiave(b, ordine.colonna)
  if (va == null && vb == null) return 0
  if (va == null) return 1
  if (vb == null) return -1
  const base =
    typeof va === "number" && typeof vb === "number"
      ? va - vb
      : String(va).localeCompare(String(vb), "it", { numeric: true, sensitivity: "base" })
  return ordine.verso === "asc" ? base : -base
}

function chiave(voce: VoceElenco, colonna: ColonnaElenco): string | number | null {
  if (colonna === "debitore") return voce.tipo === "singola" ? voce.riga.debitore : voce.gruppo.debitore
  if (colonna === "importo") return voce.tipo === "singola" ? voce.riga.importoCentesimi : voce.gruppo.sommaCentesimi
  if (colonna === "blocchetti") return chiaveBlocchetti(voce)
  if (colonna === "pagamento") return dataPagamento(voce)
  if (colonna === "scadenza") return dataScadenza(voce)
  if (colonna === "iuv") return chiaveIuv(voce)
  return ETICHETTA_STATO[statoVoce(voce)]
}

function chiaveBlocchetti(voce: VoceElenco): number {
  if (voce.tipo === "singola") return voce.riga.blocchettiDovuti * 1000 + voce.riga.blocchettiConsegnati
  return voce.gruppo.blocchetti * 1000 + voce.gruppo.consegnati
}

function dataPagamento(voce: VoceElenco): string | null {
  if (voce.tipo === "singola") return voce.riga.dataPagamento
  return dataPiuRecente(voce.righe.map((riga) => riga.dataPagamento))
}

function dataScadenza(voce: VoceElenco): string | null {
  if (voce.tipo === "singola") return voce.riga.dataScadenza
  return dataPiuRecente(voce.righe.map((riga) => riga.dataScadenza))
}

function chiaveIuv(voce: VoceElenco): string {
  if (voce.tipo === "singola") return voce.riga.iuv
  return voce.righe.map((riga) => riga.iuv).sort((a, b) => a.localeCompare(b, "it", { numeric: true }))[0] ?? ""
}
