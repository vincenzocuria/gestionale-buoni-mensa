import { analizzaBlocchetti } from "@/lib/audit/gruppi"
import type { AnalisiAudit } from "@/lib/audit/tipi"
import { formatDataIt } from "@/lib/format/data-it"
import { formatEuro } from "@/lib/format/euro"
import type { RigaElenco } from "@/lib/pagamenti/tipi"
import { ETICHETTA_STATO } from "@/lib/pagamenti/stato"

export type Foglio = {
  nome: string
  intestazioni: string[]
  righe: string[][]
}

export function fogliExport(elenco: RigaElenco[], anno: RigaElenco[]): Foglio[] {
  const analisi = analizzaBlocchetti(anno)
  return [foglioElenco(elenco, analisi), foglioAudit(analisi)]
}

function foglioElenco(elenco: RigaElenco[], analisi: AnalisiAudit): Foglio {
  return {
    nome: "Elenco",
    intestazioni: [
      "Debitore",
      "Cognome",
      "Nome",
      "Codice fiscale",
      "Importo",
      "Anno scolastico",
      "Pagamento",
      "Scadenza",
      "IUV",
      "Stato",
      "Audit",
    ],
    righe: elenco.map((riga) => {
      const esito = analisi.perIuv.get(riga.iuv)
      return [
        riga.debitore,
        riga.cognome,
        riga.nome,
        riga.codiceFiscale,
        formatEuro(riga.importoCentesimi),
        riga.annoScolastico,
        formatDataIt(riga.dataPagamento),
        formatDataIt(riga.dataScadenza),
        riga.iuv,
        ETICHETTA_STATO[riga.stato],
        esito?.testo || esito?.esito || "",
      ]
    }),
  }
}

function foglioAudit(analisi: AnalisiAudit): Foglio {
  return {
    nome: "Audit",
    intestazioni: ["Debitore", "Anno scolastico", "Esito", "Importo", "Blocchetti", "Consegnati", "Dettaglio"],
    righe: analisi.gruppi.map((gruppo) => [
      gruppo.debitore,
      gruppo.annoScolastico,
      gruppo.esito === "accorpato" ? "Accorpato" : "Anomalia",
      formatEuro(gruppo.sommaCentesimi),
      String(gruppo.blocchetti),
      String(gruppo.consegnati),
      gruppo.testo,
    ]),
  }
}
