import Link from "next/link"

const SERVER: Record<string, string> = {
  comune: "Server del Comune",
  vercel: "Vercel",
  locale: "PC di sviluppo",
}

export function FooterPrivacy() {
  const server = SERVER[process.env.MENSA_SERVER ?? ""] ?? "Server sconosciuto"
  const versione = process.env.MENSA_VERSIONE
  const compilata = process.env.MENSA_COMPILATA
  const quando = compilata
    ? new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Rome" }).format(
        new Date(compilata),
      )
    : null

  return (
    <footer className="mt-auto flex flex-col gap-1 border-t bg-card py-4 text-center text-xs text-muted-foreground">
      <Link href="/privacy" className="underline hover:text-foreground">
        Informativa Privacy
      </Link>
      <span>
        {server}
        {versione ? ` · versione ${versione}` : null}
        {quando ? ` · aggiornata il ${quando}` : null}
      </span>
    </footer>
  )
}
