"use client"

import { Button } from "@/components/ui/button"

export function Paginazione({
  pagina,
  pagine,
  dal,
  al,
  totale,
  onPagina,
}: {
  pagina: number
  pagine: number
  dal: number
  al: number
  totale: number
  onPagina: (pagina: number) => void
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">
        {totale === 0 ? "Nessun bollettino" : `${dal}–${al} di ${totale}`}
      </p>
      {pagine > 1 ? (
        <div className="flex items-center gap-2" role="navigation" aria-label="Pagine">
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
