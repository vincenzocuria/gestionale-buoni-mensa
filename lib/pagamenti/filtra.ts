import type { FiltroElenco, RigaElenco } from "@/lib/pagamenti/tipi"

export const FILTRI: { id: FiltroElenco; etichetta: string }[] = [
  { id: "tutti", etichetta: "Tutti" },
  { id: "paganti", etichetta: "Paganti" },
  { id: "non_paganti", etichetta: "Non paganti" },
  { id: "da_consegnare", etichetta: "Da consegnare" },
  { id: "consegnati", etichetta: "Consegnati" },
]

export function filtraPagamenti(righe: RigaElenco[], filtro: FiltroElenco, ricerca: string): RigaElenco[] {
  const ago = ricerca.trim().toLowerCase().replace(/^'+/, "")
  return righe.filter((riga) => corrispondeFiltro(riga, filtro) && corrispondeRicerca(riga, ago))
}

export function eFiltroElenco(valore: string | null): valore is FiltroElenco {
  return FILTRI.some((filtro) => filtro.id === valore)
}

function corrispondeFiltro(riga: RigaElenco, filtro: FiltroElenco): boolean {
  if (filtro === "tutti") return true
  if (filtro === "paganti") return riga.dataPagamento != null
  if (filtro === "non_paganti") return riga.dataPagamento == null
  if (filtro === "da_consegnare") return riga.stato === "da_consegnare"
  return riga.stato === "consegnato"
}

function corrispondeRicerca(riga: RigaElenco, ago: string): boolean {
  if (!ago) return true
  return [riga.cognome, riga.nome, riga.debitore, riga.codiceFiscale, riga.iuv].some((campo) =>
    campo.toLowerCase().includes(ago),
  )
}
