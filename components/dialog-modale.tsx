"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { cn } from "cn"

export function DialogModale({
  className,
  children,
  onChiudi,
}: {
  className?: string
  children: ReactNode
  onChiudi: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [destinazione, setDestinazione] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setDestinazione(document.body)
  }, [])

  useEffect(() => {
    const nodo = dialog.current
    if (!nodo || nodo.open) return
    nodo.showModal()
  }, [destinazione])

  if (!destinazione) return null

  return createPortal(
    <dialog
      ref={dialog}
      className={cn(
        "fixed inset-0 z-50 m-auto h-fit max-h-[calc(100%-2rem)] max-w-[calc(100%-2rem)] overflow-x-hidden overflow-y-auto whitespace-normal rounded-xl border border-border bg-popover p-0 text-popover-foreground shadow-lg backdrop:bg-black/40",
        className,
      )}
      onClose={onChiudi}
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) onChiudi()
      }}
    >
      {children}
    </dialog>,
    destinazione,
  )
}
