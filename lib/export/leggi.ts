import { eAnnoImportato, righeDellAnno } from "@/lib/anno-scolastico/calcola"
import type { Client } from "@libsql/client"
import { leggiTutti } from "@/lib/db/pagamenti"
import { eFiltroElenco, filtraPagamenti } from "@/lib/pagamenti/filtra"
import { filtraRighePeriodo, PERIODO_VUOTO, type Periodo } from "@/lib/pagamenti/periodo"
import type { FiltroElenco, RigaElenco } from "@/lib/pagamenti/tipi"
import { aVista } from "@/lib/pagamenti/vista"

export async function righeAnno(client: Client, anno: string): Promise<RigaElenco[] | null> {
  if (!eAnnoImportato(anno)) return null
  const viste = (await leggiTutti(client)).map(aVista).filter((riga) => eAnnoImportato(riga.annoScolastico))
  return righeDellAnno(viste, anno)
}

export function applicaVista(
  anno: RigaElenco[],
  filtro: string | null,
  ricerca: string,
  periodo: Periodo = PERIODO_VUOTO,
): RigaElenco[] {
  const scelto: FiltroElenco = eFiltroElenco(filtro) ? filtro : "tutti"
  return filtraRighePeriodo(filtraPagamenti(anno, scelto, ricerca), periodo)
}
