import { getClient } from "@/lib/db/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Controllo di salute per Coolify: nessun dato, nessuna autenticazione.
// Risponde 200 solo se il database è raggiungibile.
export async function GET() {
  try {
    await getClient()`select 1`
    return Response.json({ stato: "ok" }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return Response.json({ stato: "database non raggiungibile" }, { status: 503, headers: { "Cache-Control": "no-store" } })
  }
}
