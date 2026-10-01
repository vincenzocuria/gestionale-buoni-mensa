"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"

export function ModaleConferma({
  titolo,
  testo,
  pending,
  onConferma,
  onChiudi,
}: {
  titolo: string
  testo: string
  pending: boolean
  onConferma: () => void
  onChiudi: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const nodo = dialog.current
    if (!nodo || nodo.open) return
    nodo.showModal()
  }, [])

  return (
    <dialog
      ref={dialog}
      className="w-[min(28rem,calc(100%-2rem))] rounded-xl border border-border bg-popover p-0 text-popover-foreground shadow-lg backdrop:bg-black/40"
      onClose={onChiudi}
      onClick={(evento) => {
        evento.stopPropagation()
        if (evento.target === evento.currentTarget) onChiudi()
      }}
    >
      <div className="px-4 py-3">
        <h2 className="font-medium">{titolo}</h2>
        <p className="mt-2 text-sm">{testo}</p>
      </div>
      <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
        <Button type="button" variant="outline" disabled={pending} onClick={onChiudi}>
          Annulla
        </Button>
        <Button type="button" disabled={pending} onClick={onConferma}>
          Conferma
        </Button>
      </div>
    </dialog>
  )
}
