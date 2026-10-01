import { TableHead } from "@/components/ui/table"
import type { ColonnaElenco, OrdineElenco } from "@/lib/pagamenti/ordina"

export function IntestazioneOrdine({
  colonna,
  etichetta,
  ordine,
  onOrdina,
}: {
  colonna: ColonnaElenco
  etichetta: string
  ordine: OrdineElenco | null
  onOrdina: (colonna: ColonnaElenco) => void
}) {
  const attiva = ordine?.colonna === colonna
  const verso = attiva ? ordine.verso : null
  return (
    <TableHead aria-sort={verso === "asc" ? "ascending" : verso === "desc" ? "descending" : "none"}>
      <button
        type="button"
        className="inline-flex items-center gap-1 text-left"
        aria-label={attiva ? `Ordina per ${etichetta}, verso ${verso === "asc" ? "crescente" : "decrescente"}` : `Ordina per ${etichetta}`}
        onClick={() => onOrdina(colonna)}
      >
        {etichetta}
        <span aria-hidden="true" className="w-3 text-xs text-muted-foreground">
          {verso === "asc" ? "↑" : verso === "desc" ? "↓" : ""}
        </span>
      </button>
    </TableHead>
  )
}
