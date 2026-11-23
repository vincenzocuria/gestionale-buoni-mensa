"use client"

import { useState } from "react"
import { ModaleConferma } from "@/components/modale-conferma"
import { ModaleConsegna } from "@/components/modale-consegna"
import { formatEuro } from "@/lib/format/euro"
import { ModificaConsegna } from "@/components/modifica-consegna"
import { Button } from "@/components/ui/button"
import { testoConfermaAnnulla } from "@/lib/consegna/testo-conferma"
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
      {gruppo.blocchetti > 0 ? (
        <ModificaConsegna
          tempi={tempi}
          consegnati={gruppo.consegnati}
          massimo={gruppo.blocchetti}
          pending={pending}
          onAzione={onConsegna}
        />
      ) : null}
      {conferma ? (
        <ModaleConsegna
          debitore={gruppo.debitore}
          residui={residui}
          accorpato={gruppo.esito === "accorpato" && gruppo.pagamenti.length > 1}
          nota={
            gruppo.esito === "anomalia" && gruppo.residuoCentesimi > 0
              ? `Restano ${formatEuro(gruppo.residuoCentesimi)} da chiarire: il pagamento resta tra le anomalie.`
              : undefined
          }
          pending={pending}
          onChiudi={() => setConferma(false)}
          onConferma={(quanti) => {
            setConferma(false)
            onConsegna("completa", { quanti })
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
