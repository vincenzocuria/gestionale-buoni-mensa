import type { StatoPagamento } from "@/lib/pagamenti/tipi"
import { statoVoce, type VoceElenco } from "@/lib/pagamenti/voci"

const SFONDO: Record<StatoPagamento, string> = {
  da_consegnare: "bg-amber-100/80 hover:bg-amber-100",
  consegnato: "bg-emerald-100/80 hover:bg-emerald-100",
  non_pagato: "bg-stone-200/80 hover:bg-stone-200",
}

export function classeSfondoVoce(voce: VoceElenco): string {
  if (voce.tipo === "gruppo" && voce.gruppo.esito === "anomalia") {
    return "bg-rose-100/80 hover:bg-rose-100"
  }
  return SFONDO[statoVoce(voce)]
}
