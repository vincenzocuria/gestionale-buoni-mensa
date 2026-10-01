"use client"

import { Button } from "@/components/ui/button"
import type { EsitoAuditRiga } from "@/lib/audit/tipi"
import type { AzioneConsegna, RigaElenco } from "@/lib/pagamenti/tipi"

export function AzioniConsegna({
  riga,
  pending,
  onAzione,
  esito,
  size = "sm",
}: {
  riga: RigaElenco
  pending: boolean
  onAzione: (azione: AzioneConsegna) => void
  esito?: EsitoAuditRiga
  size?: "sm" | "default"
}) {
  if (!riga.dataPagamento) {
    return <span className="text-xs text-muted-foreground">Non pagato</span>
  }
  if (esito === "anomalia") {
    return <span className="text-xs text-destructive">Anomalia</span>
  }
  if (esito === "accorpato") {
    return <span className="text-xs text-muted-foreground">Nel gruppo</span>
  }

  const residui = riga.blocchettiDovuti - riga.blocchettiConsegnati
  return (
    <div className="flex flex-wrap gap-1">
      {residui > 0 ? (
        <Button
          type="button"
          size={size}
          disabled={pending}
          onClick={() => onAzione("completa")}
        >
          Consegnato
        </Button>
      ) : null}
      {riga.blocchettiDovuti === 2 && residui > 0 ? (
        <Button
          type="button"
          size={size}
          variant="secondary"
          disabled={pending}
          onClick={() => onAzione("parziale")}
        >
          +1
        </Button>
      ) : null}
      {riga.blocchettiConsegnati > 0 ? (
        <Button
          type="button"
          size={size}
          variant="outline"
          disabled={pending}
          onClick={() => onAzione("annulla")}
        >
          Annulla
        </Button>
      ) : null}
    </div>
  )
}
