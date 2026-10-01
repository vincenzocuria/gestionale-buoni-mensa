"use client"

import { useRef } from "react"
import { FileSpreadsheet, FileText, Upload } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FILTRI } from "@/lib/pagamenti/filtra"
import type { Periodo } from "@/lib/pagamenti/periodo"
import type { FiltroElenco } from "@/lib/pagamenti/tipi"

export function BarraStrumenti({
  filtro,
  ricerca,
  conteggi,
  importando,
  anno,
  periodo,
  onFiltro,
  onRicerca,
  onFile,
}: {
  filtro: FiltroElenco
  ricerca: string
  conteggi: Record<FiltroElenco, number>
  importando: boolean
  anno: string
  periodo: Periodo
  onFiltro: (filtro: FiltroElenco) => void
  onRicerca: (valore: string) => void
  onFile: (file: File) => void
}) {
  const input = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1">
          <label htmlFor="ricerca" className="text-sm font-medium">
            Cerca
          </label>
          <Input
            id="ricerca"
            value={ricerca}
            autoComplete="off"
            onChange={(evento) => onRicerca(evento.target.value)}
            placeholder="Cognome, nome, debitore, codice fiscale o IUV"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <a className={buttonVariants({ variant: "outline" })} href={linkExport("excel", anno, filtro, ricerca, periodo)}>
            <FileSpreadsheet />
            Excel
          </a>
          <a className={buttonVariants({ variant: "outline" })} href={linkExport("pdf", anno, filtro, ricerca, periodo)}>
            <FileText />
            PDF
          </a>
          <input
            ref={input}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(evento) => {
              const file = evento.target.files?.[0]
              evento.target.value = ""
              if (file) onFile(file)
            }}
          />
          <Button type="button" disabled={importando} onClick={() => input.current?.click()}>
            <Upload />
            {importando ? "Importazione…" : "Importa CSV"}
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtri">
        {FILTRI.map((voce) => {
          const attivo = voce.id === filtro
          const conteggio = conteggi[voce.id]
          return (
            <Button
              key={voce.id}
              type="button"
              size="sm"
              variant={attivo ? "default" : "outline"}
              aria-pressed={attivo}
              onClick={() => onFiltro(voce.id)}
            >
              {voce.etichetta}
              <span className="text-xs opacity-80">{conteggio}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}

function linkExport(
  formato: "excel" | "pdf",
  anno: string,
  filtro: FiltroElenco,
  ricerca: string,
  periodo: Periodo,
): string {
  const params = new URLSearchParams({ anno, filtro, q: ricerca, campo: periodo.campo })
  if (periodo.dal) params.set("dal", periodo.dal)
  if (periodo.al) params.set("al", periodo.al)
  return `/api/export/${formato}?${params}`
}
