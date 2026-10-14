import { MarchioComune } from "@/components/marchio-comune"

export const metadata = { title: "Accesso" }

const MESSAGGI: Record<string, string> = {
  link: "Il collegamento dalla suite non è valido o è già stato usato. Riapri il modulo dalla suite.",
  config: "Configurazione mancante. Contattare l'amministratore.",
}

export default async function AccessoPage({ searchParams }: { searchParams: Promise<{ errore?: string }> }) {
  const parametri = await searchParams
  const errore = parametri.errore ? MESSAGGI[parametri.errore] : undefined
  const suite = (process.env.SUITE_URL ?? "https://suite.vcuria.app").replace(/\/$/, "")

  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <MarchioComune>
        <h1 className="mt-1 font-serif text-4xl tracking-tight">Buoni mensa</h1>
      </MarchioComune>
      <p className="mt-3 text-muted-foreground">
        Questo registro si apre dalla Suite comunale, con il tuo account personale. Contiene codici fiscali e non è pubblico.
      </p>
      <div className="mt-8 space-y-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        {errore ? (
          <p className="text-sm text-destructive" role="alert">
            {errore}
          </p>
        ) : null}
        <a
          href={`${suite}/vai/mensa`}
          className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Apri dalla suite
        </a>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        <a href="/privacy" className="underline hover:text-foreground">
          Informativa Privacy
        </a>
      </p>
    </main>
  )
}
