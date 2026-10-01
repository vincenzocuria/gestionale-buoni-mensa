import type { Row } from "@libsql/client"
import type { Pagamento } from "@/lib/pagamenti/tipi"

export function daRigaDb(row: Row): Pagamento {
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
  }
}

export function parametriPagamento(pagamento: Pagamento): Array<string | number | null> {
  return [
    pagamento.iuv,
    pagamento.dataScadenza,
    pagamento.dataPagamento,
    pagamento.servizio,
    pagamento.tipologia,
    pagamento.importoCentesimi,
    pagamento.debitore,
    pagamento.accertamentoAnno,
    pagamento.accertamentoNumero,
    pagamento.reversaleData,
    pagamento.reversaleNumero,
    pagamento.dataEmissione,
    pagamento.pspRiferimento,
    pagamento.causale,
    pagamento.cognome,
    pagamento.nome,
    pagamento.codiceFiscale,
    pagamento.tariffaRidotta ? 1 : 0,
    pagamento.blocchettiDovuti,
    pagamento.blocchettiConsegnati,
    pagamento.annoScolastico,
  ]
}

function testo(valore: unknown): string {
  if (valore == null) return ""
  return String(valore)
}

function testoONull(valore: unknown): string | null {
  if (valore == null || valore === "") return null
  return String(valore)
}
