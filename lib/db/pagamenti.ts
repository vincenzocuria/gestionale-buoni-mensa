import type { Client, Transaction } from "@libsql/client"
import { daRigaDb, parametriPagamento } from "@/lib/db/mappa-pagamento"
import type { Pagamento } from "@/lib/pagamenti/tipi"

export type Esecutore = Pick<Client, "execute"> | Pick<Transaction, "execute">

const COLONNE = `
  iuv, data_scadenza, data_pagamento, servizio, tipologia, importo_centesimi,
  debitore, accertamento_anno, accertamento_numero, reversale_data, reversale_numero,
  data_emissione, psp_riferimento, causale, cognome, nome, codice_fiscale,
  tariffa_ridotta, blocchetti_dovuti, blocchetti_consegnati, anno_scolastico
`

const ORDINE = `
  ORDER BY
    CASE
      WHEN data_pagamento IS NOT NULL AND blocchetti_consegnati < blocchetti_dovuti THEN 0
      WHEN data_pagamento IS NULL THEN 1
      ELSE 2
    END,
    COALESCE(data_pagamento, '') DESC,
    debitore COLLATE NOCASE,
    iuv
`

export async function leggiTutti(db: Esecutore): Promise<Pagamento[]> {
  const risultato = await db.execute(`SELECT ${COLONNE} FROM pagamenti ${ORDINE}`)
  return risultato.rows.map((riga) => daRigaDb(riga))
}

export async function leggiPerIuv(db: Esecutore, iuv: string): Promise<Pagamento | null> {
  const risultato = await db.execute({
    sql: `SELECT ${COLONNE} FROM pagamenti WHERE iuv = ?`,
    args: [iuv],
  })
  const riga = risultato.rows[0]
  return riga ? daRigaDb(riga) : null
}

export async function inserisci(db: Esecutore, pagamento: Pagamento): Promise<void> {
  await db.execute({
    sql: `INSERT INTO pagamenti (${COLONNE}) VALUES (${segnaposto(21)})`,
    args: parametriPagamento(pagamento),
  })
}

export async function aggiorna(db: Esecutore, pagamento: Pagamento): Promise<void> {
  await db.execute({
    sql: `
      UPDATE pagamenti SET
        data_scadenza = ?,
        data_pagamento = ?,
        servizio = ?,
        tipologia = ?,
        importo_centesimi = ?,
        debitore = ?,
        accertamento_anno = ?,
        accertamento_numero = ?,
        reversale_data = ?,
        reversale_numero = ?,
        data_emissione = ?,
        psp_riferimento = ?,
        causale = ?,
        cognome = ?,
        nome = ?,
        codice_fiscale = ?,
        tariffa_ridotta = ?,
        blocchetti_dovuti = ?,
        blocchetti_consegnati = ?,
        anno_scolastico = ?
      WHERE iuv = ?
    `,
    args: [
      pagamento.dataScadenza,
      pagamento.dataPagamento,
      pagamento.servizio,
      pagamento.tipologia,
      pagamento.importoCentesimi,
      pagamento.debitore,
      pagamento.accertamentoAnno,
      pagamento.accertamentoNumero,
      pagamento.reversaleData,
      pagamento.reversaleNumero,
      pagamento.dataEmissione,
      pagamento.pspRiferimento,
      pagamento.causale,
      pagamento.cognome,
      pagamento.nome,
      pagamento.codiceFiscale,
      pagamento.tariffaRidotta ? 1 : 0,
      pagamento.blocchettiDovuti,
      pagamento.blocchettiConsegnati,
      pagamento.annoScolastico,
      pagamento.iuv,
    ],
  })
}

export async function salvaConsegna(db: Esecutore, iuv: string, consegnati: number): Promise<void> {
  await db.execute({
    sql: "UPDATE pagamenti SET blocchetti_consegnati = ? WHERE iuv = ?",
    args: [consegnati, iuv],
  })
}

function segnaposto(n: number): string {
  return Array.from({ length: n }, () => "?").join(", ")
}
