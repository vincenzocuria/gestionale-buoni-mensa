import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ModuloAccesso } from "@/app/accesso/modulo"
import { NOME_COOKIE, passwordConfigurata, sessioneValida } from "@/lib/auth/sessione"

export const metadata = { title: "Accesso" }

export default async function AccessoPage() {
  const jar = await cookies()
  if (sessioneValida(jar.get(NOME_COOKIE)?.value)) redirect("/")
  return <ModuloAccesso configurata={passwordConfigurata()} />
}
