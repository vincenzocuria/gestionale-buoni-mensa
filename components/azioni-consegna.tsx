"use client"

import { useState } from "react"
import { ModaleConferma } from "@/components/modale-conferma"
import { ModificaConsegna } from "@/components/modifica-consegna"
import { Button } from "@/components/ui/button"
import { testoConfermaAnnulla, testoConfermaConsegna } from "@/lib/consegna/testo-conferma"
import type { AzioneConsegna, DettaglioConsegna, RigaElenco } from "@/lib/pagamenti/tipi"

export function AzioniConsegna({
  riga,
  pending,
  onAzione,
  size = "sm",
}: {
  riga: RigaElenco
  pending: boolean
  onAzione: (azione: AzioneConsegna, dettaglio?: DettaglioConsegna) => void
  size?: "sm" | "default"
}) {
  const [conferma, setConferma] = useState(false)
  const [annullo, setAnnullo] = useState(false)
  if (!riga.dataPagamento) {
    return <span className="text-xs text-muted-foreground">Non pagato</span>
  }

  const residui = riga.blocchettiDovuti - riga.blocchettiConsegnati
  return (
    <div className="flex flex-wrap gap-1">
      {residui > 0 ? (
        <Button type="button" size={size} disabled={pending} onClick={() => setConferma(true)}>
          Consegna
        </Button>
      ) : null}
      {riga.blocchettiDovuti === 2 && residui > 0 ? (
        <Button type="button" size={size} variant="secondary" disabled={pending} onClick={() => onAzione("parziale")}>
          +1
        </Button>
      ) : null}
      {riga.blocchettiConsegnati > 0 ? (
        <Button type="button" size={size} variant="outline" disabled={pending} onClick={() => setAnnullo(true)}>
          Annulla
        </Button>
      ) : null}
      <ModificaConsegna
        tempi={riga.consegneIl}
        consegnati={riga.blocchettiConsegnati}
        massimo={riga.blocchettiDovuti}
        pending={pending}
        onAzione={onAzione}
      />
      {conferma ? (
        <ModaleConferma
          titolo="Consegna"
          testo={testoConfermaConsegna(riga.debitore, Math.max(residui, 1))}
          pending={pending}
          onChiudi={() => setConferma(false)}
          onConferma={() => {
            setConferma(false)
            onAzione("completa")
          }}
        />
      ) : null}
      {annullo ? (
        <ModaleConferma
          titolo="Annulla consegna"
          testo={testoConfermaAnnulla(riga.debitore, riga.blocchettiConsegnati)}
          pending={pending}
          onChiudi={() => setAnnullo(false)}
          onConferma={() => {
            setAnnullo(false)
            onAzione("annulla")
          }}
        />
      ) : null}
    </div>
  )
}
