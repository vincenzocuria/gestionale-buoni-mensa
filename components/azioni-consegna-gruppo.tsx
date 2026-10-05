"use client"

import { useState } from "react"
import { ModaleConferma } from "@/components/modale-conferma"
import { ModificaConsegna } from "@/components/modifica-consegna"
import { Button } from "@/components/ui/button"
import { testoConfermaAnnulla, testoConfermaConsegna } from "@/lib/consegna/testo-conferma"
import type { GruppoAudit } from "@/lib/audit/tipi"
import type { AzioneConsegna, DettaglioConsegna } from "@/lib/pagamenti/tipi"

export function AzioniConsegnaGruppo({
  gruppo,
  pending,
  onConsegna,
}: {
  gruppo: GruppoAudit
  pending: boolean
  onConsegna: (azione: AzioneConsegna, dettaglio?: DettaglioConsegna) => void
}) {
  const [conferma, setConferma] = useState(false)
  const [annullo, setAnnullo] = useState(false)
  const residui = gruppo.blocchetti - gruppo.consegnati
  const tempi = gruppo.pagamenti.flatMap((pagamento) => pagamento.consegneIl ?? [])
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
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => setAnnullo(true)}>
          Annulla
        </Button>
      ) : null}
      {gruppo.esito === "accorpato" ? (
        <ModificaConsegna
          tempi={tempi}
          consegnati={gruppo.consegnati}
          massimo={gruppo.blocchetti}
          pending={pending}
          onAzione={onConsegna}
        />
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
      {annullo ? (
        <ModaleConferma
          titolo="Annulla consegna"
          testo={testoConfermaAnnulla(gruppo.debitore, gruppo.consegnati)}
          pending={pending}
          onChiudi={() => setAnnullo(false)}
          onConferma={() => {
            setAnnullo(false)
            onConsegna("annulla")
          }}
        />
      ) : null}
    </div>
  )
}
