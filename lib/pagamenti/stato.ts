import type { StatoPagamento } from "@/lib/pagamenti/tipi"

export function statoPagamento(riga: {
  dataPagamento: string | null
  blocchettiDovuti: number
  blocchettiConsegnati: number
}): StatoPagamento {
  if (!riga.dataPagamento) return "non_pagato"
  if (riga.blocchettiDovuti > 0 && riga.blocchettiConsegnati >= riga.blocchettiDovuti) {
    return "consegnato"
  }
  return "da_consegnare"
}

export const ETICHETTA_STATO: Record<StatoPagamento, string> = {
  non_pagato: "Non pagato",
  da_consegnare: "Da consegnare",
  consegnato: "Consegnato",
}
