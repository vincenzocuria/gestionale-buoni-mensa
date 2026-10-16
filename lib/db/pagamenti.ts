import { scriviConsegne } from "@/lib/consegna/tempi"
import type { Esecutore } from "@/lib/db/client"
import { COLONNE_PAGAMENTO, daRigaDb, rigaPagamento, type RigaDb } from "@/lib/db/mappa-pagamento"
import type { Pagamento } from "@/lib/pagamenti/tipi"

export type { Esecutore }

const COLONNE_AGGIORNABILI = COLONNE_PAGAMENTO.filter((colonna) => colonna !== "iuv")

// Stesso ordine che dava SQLite:
// - le stringhe si confrontano byte per byte (COLLATE "C" = BINARY di SQLite);
// - "debitore COLLATE NOCASE" porta in minuscolo solo le lettere ASCII, come translate().
export async function leggiTutti(db: Esecutore): Promise<Pagamento[]> {
  const righe = await db<RigaDb[]>`
    SELECT ${db(COLONNE_PAGAMENTO)} FROM pagamenti
    ORDER BY
      CASE
        WHEN data_pagamento IS NOT NULL AND blocchetti_consegnati < blocchetti_dovuti THEN 0
        WHEN data_pagamento IS NULL THEN 1
        ELSE 2
      END,
      COALESCE(data_pagamento, '') COLLATE "C" DESC,
      translate(debitore, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') COLLATE "C",
      iuv COLLATE "C"
  `
  return righe.map((riga) => daRigaDb(riga))
}

/**
 * Con `perAggiornare` la riga resta bloccata fino alla fine della transazione:
 * l'import non sovrascrive una consegna registrata nel frattempo.
 */
export async function leggiPerIuv(
  db: Esecutore,
  iuv: string,
  opzioni: { perAggiornare?: boolean } = {},
): Promise<Pagamento | null> {
  const righe = opzioni.perAggiornare
    ? await db<RigaDb[]>`SELECT ${db(COLONNE_PAGAMENTO)} FROM pagamenti WHERE iuv = ${iuv} FOR UPDATE`
    : await db<RigaDb[]>`SELECT ${db(COLONNE_PAGAMENTO)} FROM pagamenti WHERE iuv = ${iuv}`
  const riga = righe[0]
  return riga ? daRigaDb(riga) : null
}

export async function inserisci(db: Esecutore, pagamento: Pagamento): Promise<void> {
  await db`INSERT INTO pagamenti ${db(rigaPagamento(pagamento), COLONNE_PAGAMENTO)}`
}

export async function aggiorna(db: Esecutore, pagamento: Pagamento): Promise<void> {
  await db`
    UPDATE pagamenti SET ${db(rigaPagamento(pagamento), COLONNE_AGGIORNABILI)}
    WHERE iuv = ${pagamento.iuv}
  `
}

export async function salvaConsegna(
  db: Esecutore,
  iuv: string,
  consegnati: number,
  consegneIl: string[],
): Promise<void> {
  await db`
    UPDATE pagamenti SET blocchetti_consegnati = ${consegnati}, consegne_il = ${scriviConsegne(consegneIl)}
    WHERE iuv = ${iuv}
  `
}
