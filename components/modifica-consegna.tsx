"use client"

import { useEffect, useState } from "react"
import { DialogModale } from "@/components/dialog-modale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { testoConfermaRimozione } from "@/lib/consegna/testo-conferma"
import { formatDataIt } from "@/lib/format/data-it"
import type { DettaglioConsegna } from "@/lib/pagamenti/tipi"

export function ModificaConsegna({
  tempi,
  consegnati,
  massimo,
  pending,
  onAzione,
}: {
  tempi: string[]
  consegnati: number
  massimo: number
  pending: boolean
  onAzione: (azione: "modifica" | "rimuovi" | "registra", dettaglio: DettaglioConsegna) => void
}) {
  const [aperto, setAperto] = useState(false)
  const [bozze, setBozze] = useState<string[]>([])
  const [nuova, setNuova] = useState("")
  const [togli, setTogli] = useState<number | null>(null)
  const posti = Math.max(0, massimo - consegnati)

  useEffect(() => {
    if (!aperto) return
    setBozze(tempi.map((iso) => iso.slice(0, 16)))
    setNuova("")
    setTogli(null)
  }, [aperto, tempi])

  if (massimo <= 0 && tempi.length === 0) return null

  return (
    <>
      <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => setAperto(true)}>
        Orari
      </Button>
      {aperto ? (
        <DialogModale className="w-[min(28rem,calc(100%-2rem))]" onChiudi={() => setAperto(false)}>
          <div className="px-4 py-3">
            <h2 className="font-medium">Orari di consegna</h2>
            {tempi.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Nessun orario registrato.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {tempi.map((iso, indice) => (
                  <li key={`${iso}-${indice}`} className="flex flex-wrap items-end gap-2">
                    <label className="min-w-0 flex-1 text-sm">
                      <span className="text-muted-foreground">Consegna {indice + 1}</span>
                      <Input
                        className="mt-1"
                        type="datetime-local"
                        value={bozze[indice] ?? iso.slice(0, 16)}
                        disabled={pending}
                        onChange={(evento) =>
                          setBozze((attuali) => {
                            const copia = tempi.map((voce, i) => attuali[i] ?? voce.slice(0, 16))
                            copia[indice] = evento.target.value
                            return copia
                          })
                        }
                      />
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      disabled={pending}
                      onClick={() => onAzione("modifica", { indice, quando: bozze[indice] ?? iso.slice(0, 16) })}
                    >
                      Salva
                    </Button>
                    <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => setTogli(indice)}>
                      Togli
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {togli != null ? (
              <p className="mt-3 text-sm">
                {testoConfermaRimozione(formatDataIt(tempi[togli] ?? ""))}
                <span className="mt-2 flex gap-2">
                  <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => setTogli(null)}>
                    Indietro
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending}
                    onClick={() => {
                      const indice = togli
                      setTogli(null)
                      setAperto(false)
                      onAzione("rimuovi", { indice })
                    }}
                  >
                    Conferma
                  </Button>
                </span>
              </p>
            ) : null}
            {posti > 0 ? (
              <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-border pt-3">
                <label className="min-w-0 flex-1 text-sm">
                  <span className="text-muted-foreground">Nuova consegna</span>
                  <Input
                    className="mt-1"
                    type="datetime-local"
                    value={nuova}
                    disabled={pending}
                    onChange={(evento) => setNuova(evento.target.value)}
                  />
                </label>
                <Button
                  type="button"
                  size="sm"
                  disabled={pending || nuova === ""}
                  onClick={() => {
                    setAperto(false)
                    onAzione("registra", { quando: nuova })
                  }}
                >
                  Aggiungi
                </Button>
              </div>
            ) : null}
          </div>
          <div className="flex justify-end border-t border-border px-4 py-3">
            <Button type="button" variant="outline" disabled={pending} onClick={() => setAperto(false)}>
              Chiudi
            </Button>
          </div>
        </DialogModale>
      ) : null}
    </>
  )
}
