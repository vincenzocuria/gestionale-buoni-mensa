"use client"

import { Button } from "@/components/ui/button"
import { DialogModale } from "@/components/dialog-modale"

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
  return (
    <DialogModale className="w-[min(28rem,calc(100%-2rem))]" onChiudi={onChiudi}>
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
    </DialogModale>
  )
}
