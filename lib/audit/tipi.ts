export type RigaAudit = {
  iuv: string
  importoCentesimi: number
  dataPagamento: string | null
  codiceFiscale: string
  debitore: string
  cognome: string
  nome: string
  annoScolastico: string
  blocchettiConsegnati: number
}

export type EsitoAuditRiga = "valido" | "accorpato" | "anomalia" | "non_pagato"

export type GruppoAudit = {
  id: string
  annoScolastico: string
  debitore: string
  esito: "accorpato" | "anomalia"
  pagamenti: RigaAudit[]
  sommaCentesimi: number
  blocchetti: number
  consegnati: number
  testo: string
}

export type AnalisiAudit = {
  gruppi: GruppoAudit[]
  perIuv: Map<string, { esito: EsitoAuditRiga; testo: string; gruppoId: string | null }>
}
