"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DialogModale } from "@/components/dialog-modale"
import { testoConfermaConsegna } from "@/lib/consegna/testo-conferma"

// Conferma della consegna con la scelta di quanti blocchetti si danno adesso
// (da 1 a quelli ancora da consegnare). Il resto rimane da consegnare.
export function ModaleConsegna({
  debitore,
  residui,
  accorpato = false,
  nota,
  pending,
  onConferma,
  onChiudi,
}: {
  debitore: string
  residui: number
  accorpato?: boolean
  nota?: string
  pending: boolean
  onConferma: (quanti: number) => void
  onChiudi: () => void
}) {
  const massimo = Math.max(1, residui)
  const [quanti, setQuanti] = useState(massimo)
  const restano = massimo - quanti
  return (
    <DialogModale className="w-[min(28rem,calc(100%-2rem))]" onChiudi={onChiudi}>
      <div className="px-4 py-3">
        <h2 className="font-medium">Consegna</h2>
        {massimo > 1 ? (
          <div className="mt-3">
            <p className="text-sm text-muted-foreground">Quanti blocchetti consegni adesso?</p>
            <div className="mt-2 flex flex-wrap gap-1" role="radiogroup" aria-label="Blocchetti da consegnare">
              {Array.from({ length: massimo }, (_, indice) => indice + 1).map((n) => (
                <Button
                  key={n}
                  type="button"
                  size="sm"
                  role="radio"
                  aria-checked={quanti === n}
                  variant={quanti === n ? "default" : "outline"}
                  disabled={pending}
                  onClick={() => setQuanti(n)}
                  className="min-w-10"
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
        <p className="mt-3 text-sm">{testoConfermaConsegna(debitore, quanti, accorpato)}</p>
        {restano > 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {restano === 1 ? "Resta 1 blocchetto da consegnare." : `Restano ${restano} blocchetti da consegnare.`}
          </p>
        ) : null}
        {nota ? <p className="mt-1 text-sm text-muted-foreground">{nota}</p> : null}
      </div>
      <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
        <Button type="button" variant="outline" disabled={pending} onClick={onChiudi}>
          Annulla
        </Button>
        <Button type="button" disabled={pending} onClick={() => onConferma(quanti)}>
          Conferma
        </Button>
      </div>
    </DialogModale>
  )
}
