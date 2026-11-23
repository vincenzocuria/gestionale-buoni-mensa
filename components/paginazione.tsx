"use client"

import { Button } from "@/components/ui/button"
import { SCELTE_PER_PAGINA } from "@/lib/pagamenti/pagina"

export function Paginazione({
  pagina,
  pagine,
  dal,
  al,
  totale,
  onPagina,
  perPagina,
  onPerPagina,
  sopra = false,
}: {
  pagina: number
  pagine: number
  dal: number
  al: number
  totale: number
  onPagina: (pagina: number) => void
  perPagina: number
  onPerPagina: (quante: number) => void
  /** Copia sopra la tabella: margine sotto invece che sopra. */
  sopra?: boolean
}) {
  return (
    <div className={`${sopra ? "mb-3" : "mt-3"} flex flex-wrap items-center justify-between gap-2`}>
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">
          {totale === 0 ? "Nessun bollettino" : `${dal}–${al} di ${totale}`}
        </p>
        <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
          Righe per pagina
          <select
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground"
            value={perPagina}
            onChange={(evento) => onPerPagina(Number(evento.target.value))}
          >
            {SCELTE_PER_PAGINA.map((quante) => (
              <option key={quante} value={quante}>
                {quante}
              </option>
            ))}
          </select>
        </label>
      </div>
      {pagine > 1 ? (
        <div className="flex items-center gap-2" role="navigation" aria-label={sopra ? "Pagine (sopra)" : "Pagine"}>
          <Button type="button" size="sm" variant="outline" disabled={pagina <= 1} onClick={() => onPagina(pagina - 1)}>
            Precedente
          </Button>
          <span className="text-sm">
            {pagina} / {pagine}
          </span>
          <Button type="button" size="sm" variant="outline" disabled={pagina >= pagine} onClick={() => onPagina(pagina + 1)}>
            Successiva
          </Button>
        </div>
      ) : null}
    </div>
  )
}
