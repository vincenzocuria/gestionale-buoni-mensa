"use client"

import { useEffect, useRef } from "react"
import { AzioniConsegnaGruppo } from "@/components/azioni-consegna-gruppo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDataIt } from "@/lib/format/data-it"
import { formatEuro } from "@/lib/format/euro"
import type { GruppoAudit } from "@/lib/audit/tipi"
import type { AzioneConsegna, RigaElenco } from "@/lib/pagamenti/tipi"

export function ModaleGruppo({
  gruppo,
  righe,
  pending,
  onChiudi,
  onConsegna,
}: {
  gruppo: GruppoAudit
  righe: RigaElenco[]
  pending: boolean
  onChiudi: () => void
  onConsegna: (azione: AzioneConsegna) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const nodo = dialog.current
    if (!nodo || nodo.open) return
    nodo.showModal()
  }, [])

  const voci = [...righe].sort((a, b) => (b.dataPagamento ?? "").localeCompare(a.dataPagamento ?? ""))

  return (
    <dialog
      ref={dialog}
      className="w-[min(42rem,calc(100%-2rem))] rounded-xl border border-border bg-popover p-0 text-popover-foreground shadow-lg backdrop:bg-black/40"
      onClose={onChiudi}
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) onChiudi()
      }}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="font-medium">{gruppo.debitore}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{gruppo.testo}</p>
        </div>
        <Badge variant="destructive">Anomalia</Badge>
      </div>
      <div className="max-h-[60vh] overflow-auto px-4 py-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="py-1 pr-3 font-medium">Importo</th>
              <th className="py-1 pr-3 font-medium">Pagamento</th>
              <th className="py-1 pr-3 font-medium">Scadenza</th>
              <th className="py-1 font-medium">IUV</th>
            </tr>
          </thead>
          <tbody>
            {voci.map((riga) => (
              <tr key={riga.iuv} className="border-t border-border">
                <td className="py-2 pr-3">{formatEuro(riga.importoCentesimi)}</td>
                <td className="py-2 pr-3">{formatDataIt(riga.dataPagamento)}</td>
                <td className="py-2 pr-3">{formatDataIt(riga.dataScadenza)}</td>
                <td className="py-2 font-mono text-xs break-all">{riga.iuv}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-sm">
          Totale {formatEuro(gruppo.sommaCentesimi)}
          {gruppo.esito === "accorpato"
            ? ` · ${gruppo.consegnati >= gruppo.blocchetti ? "consegnato" : "da consegnare"} ${gruppo.consegnati}/${gruppo.blocchetti}`
            : null}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
        {gruppo.esito === "accorpato" ? (
          <AzioniConsegnaGruppo gruppo={gruppo} pending={pending} onConsegna={onConsegna} />
        ) : (
          <span />
        )}
        <Button type="button" variant="outline" onClick={onChiudi}>
          Chiudi
        </Button>
      </div>
    </dialog>
  )
}
