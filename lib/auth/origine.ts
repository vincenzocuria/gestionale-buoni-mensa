// Indirizzo pubblico della richiesta (dietro il proxy di Coolify) per i reindirizzamenti.
export function destinazione(request: Request, percorso: string): URL {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host")
  const proto = request.headers.get("x-forwarded-proto") ?? "http"
  if (!host) return new URL(percorso, request.url)
  return new URL(percorso, `${proto}://${host}`)
}

// Indirizzo della suite (home e accesso), senza barra finale.
export function urlSuite(): string {
  return (process.env.SUITE_URL ?? "https://suite.vcuria.app").replace(/\/$/, "")
}
