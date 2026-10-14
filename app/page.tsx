import { cookies } from "next/headers"
import { BarraComune } from "@/components/barra-comune"
import { RegistroMensa } from "@/components/registro-mensa"
import { urlSuite } from "@/lib/auth/origine"
import { NOME_COOKIE, leggiSessione } from "@/lib/auth/sessione"

export default async function Page() {
  // Il proxy garantisce già una sessione valida: qui serve solo per mostrare chi è collegato.
  const sessione = leggiSessione((await cookies()).get(NOME_COOKIE)?.value)
  const utente = {
    nome: sessione?.nome || sessione?.email || "Utente",
    solaLettura: sessione?.ruolo_modulo === "lettura",
  }

  return (
    <>
      <BarraComune utente={utente} suiteUrl={urlSuite()} />
      <RegistroMensa />
    </>
  )
}
