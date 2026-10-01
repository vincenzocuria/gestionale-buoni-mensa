import { Badge } from "@/components/ui/badge"
import { ETICHETTA_STATO } from "@/lib/pagamenti/stato"
import type { StatoPagamento } from "@/lib/pagamenti/tipi"

export function StatoPagamentoBadge({ stato }: { stato: StatoPagamento }) {
  const variante = stato === "consegnato" ? "secondary" : stato === "non_pagato" ? "outline" : "default"
  return <Badge variant={variante}>{ETICHETTA_STATO[stato]}</Badge>
}
