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
  consegneIl: string[]
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
  consegneIl: string[]
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
  | "anomalie"

export type AzioneConsegna = "completa" | "parziale" | "annulla" | "modifica" | "rimuovi" | "registra"

export type DettaglioConsegna = {
  indice?: number
  quando?: string
  /** Solo per «completa»: quanti blocchetti consegnare ora (default: tutti quelli mancanti). */
  quanti?: number
}

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
  anomalie: number
}

export type RiepilogoImport = {
  nuovi: number
  aggiornati: number
  ignorati: number
  invariati: number
  esclusiTest: number
  fuoriPeriodo: number
  altriServizi: number
  righeLette: number
  errori: string[]
  /** Pagati su un altro servizio con «mensa» nella causale: fuori dal registro, da gestire a mano. */
  mensaSuAltroServizio: SegnalazioneMensa[]
}

export type SegnalazioneMensa = {
  riga: number
  iuv: string
  servizio: string
  causale: string
  debitore: string
  codiceFiscale: string
  importoCentesimi: number
  dataPagamento: string | null
}
