"use client"

import { Button } from "@/components/ui/button"
import { formatEuro } from "@/lib/format/euro"
import type { GruppoAudit } from "@/lib/audit/tipi"

export function AuditConsegne({
  gruppi,
  anno,
  pendingId,
  onConsegna,
}: {
  gruppi: GruppoAudit[]
  anno: string
  pendingId: string | null
  onConsegna: (id: string, azione: "completa" | "parziale" | "annulla") => void
}) {
  const anomalie = gruppi.filter((gruppo) => gruppo.esito === "anomalia")
  const accorpati = gruppi.filter((gruppo) => gruppo.esito === "accorpato")

  return (
    <section className="rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10" aria-label="Audit consegne">
      <h2 className="text-sm font-medium">Audit consegne · {anno}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Un blocchetto vale 40 €. Importi diversi sono anomalie, salvo che i pagamenti della stessa persona in questo anno, sommati, facciano 40 € o un multiplo.
      </p>
      {anomalie.length === 0 && accorpati.length === 0 ? (
        <p className="mt-3 text-sm">Nessuna anomalia in questo anno.</p>
      ) : null}
      {anomalie.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {anomalie.map((gruppo) => (
            <li key={gruppo.id} className="rounded-lg bg-destructive/10 px-3 py-2 text-sm">
              <p className="font-medium">{gruppo.debitore}</p>
              <p>{gruppo.testo}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {accorpati.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {accorpati.map((gruppo) => {
            const residui = gruppo.blocchetti - gruppo.consegnati
            const pending = pendingId === gruppo.id
            return (
              <li key={gruppo.id} className="rounded-lg bg-muted px-3 py-2 text-sm">
                <p className="font-medium">
                  {gruppo.debitore} · accorpato · {formatEuro(gruppo.sommaCentesimi)}
                </p>
                <p>{gruppo.testo}</p>
                <p className="text-muted-foreground">
                  Consegnati {gruppo.consegnati}/{gruppo.blocchetti}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {residui > 0 ? (
                    <Button type="button" size="sm" disabled={pending} onClick={() => onConsegna(gruppo.id, "completa")}>
                      Consegnato
                    </Button>
                  ) : null}
                  {gruppo.blocchetti > 1 && residui > 0 ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => onConsegna(gruppo.id, "parziale")}
                    >
                      +1
                    </Button>
                  ) : null}
                  {gruppo.consegnati > 0 ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => onConsegna(gruppo.id, "annulla")}
                    >
                      Annulla
                    </Button>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}
