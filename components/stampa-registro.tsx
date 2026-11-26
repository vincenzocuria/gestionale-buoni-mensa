"use client"

import { useState } from "react"
import { Printer } from "lucide-react"
import { DialogModale } from "@/components/dialog-modale"
import { Button, buttonVariants } from "@/components/ui/button"
import type { Periodo } from "@/lib/pagamenti/periodo"

type Contenuto = "da_consegnare" | "con_anomalie"

const SCELTE: { id: Contenuto; titolo: string; testo: string }[] = [
  {
    id: "da_consegnare",
    titolo: "Solo da consegnare",
    testo: "I genitori che hanno pagato e devono ancora ritirare blocchetti.",
  },
  {
    id: "con_anomalie",
    titolo: "Da consegnare e anomalie",
    testo: "Aggiunge gli importi che non fanno blocchetti interi, evidenziati, con la cifra da chiarire.",
  },
]

export function StampaRegistro({ anno, ricerca, periodo }: { anno: string; ricerca: string; periodo: Periodo }) {
  const [aperto, setAperto] = useState(false)
  const [contenuto, setContenuto] = useState<Contenuto>("da_consegnare")
  const filtrato = Boolean(ricerca.trim() || periodo.dal || periodo.al)

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setAperto(true)}>
        <Printer />
        Stampa registro
      </Button>
      {aperto ? (
        <DialogModale className="w-[min(30rem,calc(100%-2rem))]" onChiudi={() => setAperto(false)}>
          <div className="px-4 py-3">
            <h2 className="font-medium">Stampa registro consegne</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              PDF su carta intestata del Comune, anno {anno}, in ordine alfabetico, con le colonne per la data di ritiro e la firma di chi ritira.
            </p>
            <fieldset className="mt-3 space-y-2">
              <legend className="sr-only">Cosa stampare</legend>
              {SCELTE.map((scelta) => (
                <label
                  key={scelta.id}
                  className="flex cursor-pointer gap-3 rounded-lg border border-border px-3 py-2 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="contenuto-registro"
                    className="mt-1"
                    checked={contenuto === scelta.id}
                    onChange={() => setContenuto(scelta.id)}
                  />
                  <span>
                    <span className="block text-sm font-medium">{scelta.titolo}</span>
                    <span className="block text-xs text-muted-foreground">{scelta.testo}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            {filtrato ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Vale la ricerca o il periodo che hai impostato nella pagina: il PDF li riporta in alto.
              </p>
            ) : null}
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
            <Button type="button" variant="outline" onClick={() => setAperto(false)}>
              Annulla
            </Button>
            <a
              className={buttonVariants()}
              href={linkRegistro(anno, contenuto, ricerca, periodo)}
              target="_blank"
              rel="noopener"
              onClick={() => setAperto(false)}
            >
              <Printer />
              Apri PDF
            </a>
          </div>
        </DialogModale>
      ) : null}
    </>
  )
}

export function linkRegistro(anno: string, contenuto: Contenuto, ricerca: string, periodo: Periodo): string {
  const params = new URLSearchParams({ anno, campo: periodo.campo })
  if (contenuto === "con_anomalie") params.set("anomalie", "1")
  if (ricerca.trim()) params.set("q", ricerca.trim())
  if (periodo.dal) params.set("dal", periodo.dal)
  if (periodo.al) params.set("al", periodo.al)
  return `/api/export/registro?${params}`
}
