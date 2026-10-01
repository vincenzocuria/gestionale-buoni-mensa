import { ErroreCsv } from "@/lib/csv/errore-csv"
import { leggiCsvSemicolon } from "@/lib/csv/leggi-semicolon"
import { parseDataSiscom, parseImportoCentesimi, senzaApiceIniziale } from "@/lib/csv/valori"
import type { RigaSiscom } from "@/lib/pagamenti/tipi"

const COLONNE = [
  "Data scadenza",
  "Data Pagamento",
  "Importo",
  "Debitore",
  "Accertamento anno",
  "Accertamento numero",
  "Reversale data",
  "Reversale numero",
  "IUV",
  "PspRiferimento",
  "Causale Pagamento",
  "Cognome",
  "Nome",
  "Cod Fiscale",
] as const

export type LetturaCsv = {
  righe: RigaSiscom[]
  errori: string[]
  righeLette: number
}

export function parseStampaRicerca(testo: string): LetturaCsv {
  const tabella = leggiCsvSemicolon(testo)
  if (tabella.length === 0) {
    throw new ErroreCsv("Il file CSV è vuoto.")
  }

  const intestazioni = tabella[0].map((cella) => cella.trim())
  const mancanti = COLONNE.filter((nome) => !intestazioni.includes(nome))
  if (mancanti.length > 0) {
    throw new ErroreCsv(`CSV non riconosciuto. Mancano le colonne: ${mancanti.join(", ")}.`)
  }

  const indice = new Map(intestazioni.map((nome, posizione) => [nome, posizione]))
  const righe: RigaSiscom[] = []
  const errori: string[] = []

  for (let i = 1; i < tabella.length; i++) {
    const celle = tabella[i]
    const numero = i + 1
    const cella = (nome: string) => {
      const posizione = indice.get(nome)
      if (posizione == null) return ""
      return (celle[posizione] ?? "").trim()
    }

    const iuv = senzaApiceIniziale(cella("IUV"))
    if (!iuv) {
      errori.push(`Riga ${numero}: IUV mancante.`)
      continue
    }

    const importoCentesimi = parseImportoCentesimi(cella("Importo"))
    if (importoCentesimi == null) {
      errori.push(`Riga ${numero}: importo non valido.`)
      continue
    }

    const scadenzaGrezza = cella("Data scadenza")
    const dataScadenza = parseDataSiscom(scadenzaGrezza)
    if (scadenzaGrezza && !dataScadenza) {
      errori.push(`Riga ${numero}: data di scadenza non valida.`)
      continue
    }

    const pagamentoGrezzo = cella("Data Pagamento")
    const dataPagamento = parseDataSiscom(pagamentoGrezzo)
    if (pagamentoGrezzo && !dataPagamento) {
      errori.push(`Riga ${numero}: data di pagamento non valida.`)
      continue
    }

    const reversaleGrezza = cella("Reversale data")
    const reversaleData = parseDataSiscom(reversaleGrezza)
    if (reversaleGrezza && !reversaleData) {
      errori.push(`Riga ${numero}: data reversale non valida.`)
      continue
    }

    const emissioneGrezza = cella("Data emissione")
    const dataEmissione = parseDataSiscom(emissioneGrezza)
    if (emissioneGrezza && !dataEmissione) {
      errori.push(`Riga ${numero}: data di emissione non valida.`)
      continue
    }

    righe.push({
      iuv,
      dataScadenza,
      dataPagamento,
      servizio: cella("Servizio"),
      tipologia: cella("Tipologia"),
      importoCentesimi,
      debitore: cella("Debitore"),
      accertamentoAnno: cella("Accertamento anno"),
      accertamentoNumero: cella("Accertamento numero"),
      reversaleData,
      reversaleNumero: cella("Reversale numero"),
      dataEmissione,
      pspRiferimento: cella("PspRiferimento"),
      causale: cella("Causale Pagamento"),
      cognome: cella("Cognome"),
      nome: cella("Nome"),
      codiceFiscale: senzaApiceIniziale(cella("Cod Fiscale")),
    })
  }

  return { righe, errori, righeLette: tabella.length - 1 }
}
