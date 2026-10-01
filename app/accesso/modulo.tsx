"use client"

import { useActionState } from "react"
import { entra } from "@/app/accesso/azioni"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ModuloAccesso({ configurata }: { configurata: boolean }) {
  const [stato, azione, attesa] = useActionState(entra, null)

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <p className="text-sm font-medium text-primary">Comune di San Lorenzo del Vallo</p>
      <h1 className="mt-2 font-serif text-4xl tracking-tight">Buoni mensa</h1>
      <p className="mt-3 text-muted-foreground">
        Accesso riservato all’ufficio. Il registro contiene codici fiscali e non è pubblico.
      </p>
      <form action={azione} className="mt-8 space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password dell’ufficio
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            spellCheck={false}
            required
            disabled={!configurata || attesa}
            aria-invalid={stato?.errore ? true : undefined}
          />
        </div>
        {!configurata ? (
          <p className="text-sm text-destructive" role="alert">
            Accesso non configurato: manca la variabile UFFICIO_PASSWORD sul server.
          </p>
        ) : null}
        {stato?.errore ? (
          <p className="text-sm text-destructive" role="alert">
            {stato.errore}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={!configurata || attesa}>
          {attesa ? "Accesso…" : "Entra"}
        </Button>
      </form>
    </main>
  )
}
