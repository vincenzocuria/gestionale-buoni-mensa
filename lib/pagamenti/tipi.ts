export type RigaSiscom = {
  dataScadenza: string | null
  dataPagamento: string | null
  servizio: string
  tipologia: string
  importoCentesimi: number
  debitore: string
  accertamentoAnno: string
  accertamentoNumero: string
  reversaleData: string | null
  reversaleNumero: string
  dataEmissione: string | null
  iuv: string
  pspRiferimento: string
  causale: string
  cognome: string
  nome: string
  codiceFiscale: string
}

export type Pagamento = RigaSiscom & {
  annoScolastico: string
  tariffaRidotta: boolean
  blocchettiDovuti: number
  blocchettiConsegnati: number
}

export type StatoPagamento = "non_pagato" | "da_consegnare" | "consegnato"

export type RigaElenco = {
  iuv: string
  debitore: string
  cognome: string
  nome: string
  codiceFiscale: string
  importoCentesimi: number
  tariffaRidotta: boolean
  blocchettiDovuti: number
  blocchettiConsegnati: number
  dataPagamento: string | null
  dataScadenza: string | null
  annoScolastico: string
  stato: StatoPagamento
}

export type FiltroElenco =
  | "tutti"
  | "paganti"
  | "non_paganti"
  | "da_consegnare"
  | "consegnati"

export type AzioneConsegna = "completa" | "parziale" | "annulla"

export type EsitoMerge =
  | "nuovo"
  | "aggiornato"
  | "ignorato"
  | "invariato"
  | "escluso_test"

export type Kpi = {
  paganti: number
  nonPaganti: number
  blocchettiDaConsegnare: number
  blocchettiConsegnati: number
  incassatoCentesimi: number
  daIncassareCentesimi: number
}

export type RiepilogoImport = {
  nuovi: number
  aggiornati: number
  ignorati: number
  invariati: number
  esclusiTest: number
  fuoriPeriodo: number
  righeLette: number
  errori: string[]
}
