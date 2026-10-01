"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  applicaPreset,
  presetAttivo,
  type CampoData,
  type Periodo,
  type PresetPeriodo,
} from "@/lib/pagamenti/periodo"

const PRESET: { id: PresetPeriodo; etichetta: string }[] = [
  { id: "tutto", etichetta: "Tutto" },
  { id: "oggi", etichetta: "Oggi" },
  { id: "settimana", etichetta: "Settimana" },
  { id: "mese", etichetta: "Mese" },
]

export function FiltroPeriodo({
  periodo,
  oggi,
  onCambio,
}: {
  periodo: Periodo
  oggi: string
  onCambio: (periodo: Periodo) => void
}) {
  const attivo = presetAttivo(periodo, oggi)

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="space-y-1">
        <label htmlFor="campo-data" className="text-sm font-medium">
          Periodo
        </label>
        <select
          id="campo-data"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          value={periodo.campo}
          onChange={(evento) => onCambio({ ...periodo, campo: evento.target.value as CampoData })}
        >
          <option value="pagamento">Data pagamento</option>
          <option value="scadenza">Data scadenza</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Periodi rapidi">
        {PRESET.map((voce) => (
          <Button
            key={voce.id}
            type="button"
            size="sm"
            variant={attivo === voce.id ? "default" : "outline"}
            aria-pressed={attivo === voce.id}
            onClick={() => onCambio(applicaPreset(periodo, voce.id, oggi))}
          >
            {voce.etichetta}
          </Button>
        ))}
      </div>
      <CampoDataInput
        id="periodo-dal"
        etichetta="Dal"
        valore={periodo.dal}
        onCambio={(dal) => onCambio({ ...periodo, dal })}
      />
      <CampoDataInput
        id="periodo-al"
        etichetta="Al"
        valore={periodo.al}
        onCambio={(al) => onCambio({ ...periodo, al })}
      />
    </div>
  )
}

function CampoDataInput({
  id,
  etichetta,
  valore,
  onCambio,
}: {
  id: string
  etichetta: string
  valore: string | null
  onCambio: (valore: string | null) => void
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">
        {etichetta}
      </label>
      <Input
        id={id}
        type="date"
        value={valore ?? ""}
        onChange={(evento) => onCambio(evento.target.value || null)}
      />
    </div>
  )
}
