import { conteggiBlocchetti } from "@/lib/audit/conteggi"
import type { Kpi, RigaElenco } from "@/lib/pagamenti/tipi"

export function calcolaKpi(righe: RigaElenco[]): Kpi {
  const paganti = new Set<string>()
  const nonPaganti = new Set<string>()
  let incassatoCentesimi = 0
  let daIncassareCentesimi = 0

  for (const riga of righe) {
    const codice = riga.codiceFiscale.trim()
    if (riga.dataPagamento) {
      if (codice) paganti.add(codice)
      incassatoCentesimi += riga.importoCentesimi
    } else {
      if (codice) nonPaganti.add(codice)
      daIncassareCentesimi += riga.importoCentesimi
    }
  }

  const libri = conteggiBlocchetti(righe)

  return {
    paganti: paganti.size,
    nonPaganti: nonPaganti.size,
    blocchettiDaConsegnare: libri.blocchettiDaConsegnare,
    blocchettiConsegnati: libri.blocchettiConsegnati,
    incassatoCentesimi,
    daIncassareCentesimi,
  }
}
