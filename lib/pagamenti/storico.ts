import { analizzaBlocchetti } from "@/lib/audit/gruppi"
import { chiavePersona, chiavePersonaAnno, schedaPersona, type SchedaPersona } from "@/lib/pagamenti/persona"
import type { RigaElenco } from "@/lib/pagamenti/tipi"

export type ConsegnaStorico = {
  quando: string
  iuv: string
  annoScolastico: string
}

export type StoricoPersona = {
  debitore: string
  codiceFiscale: string
  anni: SchedaPersona[]
  consegne: ConsegnaStorico[]
}

export function storicoPersona(righe: RigaElenco[], chiaveAnno: string): StoricoPersona | null {
  const persona = chiaveAnno.includes("|") ? chiaveAnno.slice(chiaveAnno.indexOf("|") + 1) : chiaveAnno
  const proprie = righe.filter((riga) => chiavePersona(riga) === persona)
  if (proprie.length === 0) return null

  const anniNomi = [...new Set(proprie.map((riga) => riga.annoScolastico))].sort((a, b) => b.localeCompare(a))
  const anni: SchedaPersona[] = []
  for (const anno of anniNomi) {
    const delAnno = proprie.filter((riga) => riga.annoScolastico === anno)
    const scheda = schedaPersona(delAnno, analizzaBlocchetti(delAnno), chiavePersonaAnno(delAnno[0]))
    if (scheda) anni.push(scheda)
  }

  const consegne: ConsegnaStorico[] = []
  for (const riga of proprie) {
    for (const quando of riga.consegneIl) {
      consegne.push({ quando, iuv: riga.iuv, annoScolastico: riga.annoScolastico })
    }
  }
  consegne.sort((a, b) => b.quando.localeCompare(a.quando) || a.iuv.localeCompare(b.iuv))

  return {
    debitore: anni[0]?.debitore || proprie[0].debitore,
    codiceFiscale: proprie.find((riga) => riga.codiceFiscale.trim())?.codiceFiscale.trim() ?? "",
    anni,
    consegne,
  }
}
