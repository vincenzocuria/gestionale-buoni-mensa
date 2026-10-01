"use client"

import { useState } from "react"
import { ModaleConferma } from "@/components/modale-conferma"
import { Button } from "@/components/ui/button"
import { testoConfermaConsegna } from "@/lib/consegna/testo-conferma"
import type { GruppoAudit } from "@/lib/audit/tipi"
import type { AzioneConsegna } from "@/lib/pagamenti/tipi"

export function AzioniConsegnaGruppo({
  gruppo,
  pending,
  onConsegna,
}: {
  gruppo: GruppoAudit
  pending: boolean
  onConsegna: (azione: AzioneConsegna) => void
}) {
  const [conferma, setConferma] = useState(false)
  const residui = gruppo.blocchetti - gruppo.consegnati
  return (
    <div className="flex flex-wrap gap-1">
      {residui > 0 ? (
        <Button type="button" size="sm" disabled={pending} onClick={() => setConferma(true)}>
          Consegna
        </Button>
      ) : null}
      {gruppo.blocchetti > 1 && residui > 0 ? (
        <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => onConsegna("parziale")}>
          +1
        </Button>
      ) : null}
      {gruppo.consegnati > 0 ? (
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => onConsegna("annulla")}>
          Annulla
        </Button>
      ) : null}
      {conferma ? (
        <ModaleConferma
          titolo="Consegna"
          testo={testoConfermaConsegna(gruppo.debitore, Math.max(residui, 1), true)}
          pending={pending}
          onChiudi={() => setConferma(false)}
          onConferma={() => {
            setConferma(false)
            onConsegna("completa")
          }}
        />
      ) : null}
    </div>
  )
}
