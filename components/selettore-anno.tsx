"use client"

import { Button } from "@/components/ui/button"

export function SelettoreAnno({
  anni,
  attivo,
  onCambio,
}: {
  anni: string[]
  attivo: string
  onCambio: (anno: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Anni scolastici">
      {anni.map((anno) => (
        <Button
          key={anno}
          type="button"
          size="sm"
          variant={anno === attivo ? "default" : "outline"}
          aria-pressed={anno === attivo}
          onClick={() => onCambio(anno)}
        >
          {anno}
        </Button>
      ))}
    </div>
  )
}
