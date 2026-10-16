import { leggiConsegne, scriviConsegne } from "@/lib/consegna/tempi"
import type { Pagamento } from "@/lib/pagamenti/tipi"

export type RigaDb = Record<string, unknown>

/** Colonne di mensa.pagamenti, nello stesso ordine della tabella. */
export const COLONNE_PAGAMENTO = [
  "iuv",
  "data_scadenza",
  "data_pagamento",
  "servizio",
  "tipologia",
  "importo_centesimi",
  "debitore",
  "accertamento_anno",
  "accertamento_numero",
  "reversale_data",
  "reversale_numero",
  "data_emissione",
  "psp_riferimento",
  "causale",
  "cognome",
  "nome",
  "codice_fiscale",
  "tariffa_ridotta",
  "blocchetti_dovuti",
  "blocchetti_consegnati",
  "anno_scolastico",
  "consegne_il",
] as const

export type ColonnaPagamento = (typeof COLONNE_PAGAMENTO)[number]

export function daRigaDb(row: RigaDb): Pagamento {
  return {
    iuv: testo(row.iuv),
    dataScadenza: testoONull(row.data_scadenza),
    dataPagamento: testoONull(row.data_pagamento),
    servizio: testo(row.servizio),
    tipologia: testo(row.tipologia),
    importoCentesimi: Number(row.importo_centesimi),
    debitore: testo(row.debitore),
    accertamentoAnno: testo(row.accertamento_anno),
    accertamentoNumero: testo(row.accertamento_numero),
    reversaleData: testoONull(row.reversale_data),
    reversaleNumero: testo(row.reversale_numero),
    dataEmissione: testoONull(row.data_emissione),
    pspRiferimento: testo(row.psp_riferimento),
    causale: testo(row.causale),
    cognome: testo(row.cognome),
    nome: testo(row.nome),
    codiceFiscale: testo(row.codice_fiscale),
    annoScolastico: testo(row.anno_scolastico),
    tariffaRidotta: Number(row.tariffa_ridotta) === 1,
    blocchettiDovuti: Number(row.blocchetti_dovuti),
    blocchettiConsegnati: Number(row.blocchetti_consegnati),
    consegneIl: leggiConsegne(row.consegne_il),
  }
}

export function rigaPagamento(pagamento: Pagamento): Record<ColonnaPagamento, string | number | null> {
  return {
    iuv: pagamento.iuv,
    data_scadenza: pagamento.dataScadenza,
    data_pagamento: pagamento.dataPagamento,
    servizio: pagamento.servizio,
    tipologia: pagamento.tipologia,
    importo_centesimi: pagamento.importoCentesimi,
    debitore: pagamento.debitore,
    accertamento_anno: pagamento.accertamentoAnno,
    accertamento_numero: pagamento.accertamentoNumero,
    reversale_data: pagamento.reversaleData,
    reversale_numero: pagamento.reversaleNumero,
    data_emissione: pagamento.dataEmissione,
    psp_riferimento: pagamento.pspRiferimento,
    causale: pagamento.causale,
    cognome: pagamento.cognome,
    nome: pagamento.nome,
    codice_fiscale: pagamento.codiceFiscale,
    tariffa_ridotta: pagamento.tariffaRidotta ? 1 : 0,
    blocchetti_dovuti: pagamento.blocchettiDovuti,
    blocchetti_consegnati: pagamento.blocchettiConsegnati,
    anno_scolastico: pagamento.annoScolastico,
    consegne_il: scriviConsegne(pagamento.consegneIl),
  }
}

function testo(valore: unknown): string {
  if (valore == null) return ""
  return String(valore)
}

function testoONull(valore: unknown): string | null {
  if (valore == null || valore === "") return null
  return String(valore)
}
