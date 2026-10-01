export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS pagamenti (
  iuv TEXT PRIMARY KEY,
  data_scadenza TEXT,
  data_pagamento TEXT,
  servizio TEXT NOT NULL DEFAULT '',
  tipologia TEXT NOT NULL DEFAULT '',
  importo_centesimi INTEGER NOT NULL,
  debitore TEXT NOT NULL DEFAULT '',
  accertamento_anno TEXT NOT NULL DEFAULT '',
  accertamento_numero TEXT NOT NULL DEFAULT '',
  reversale_data TEXT,
  reversale_numero TEXT NOT NULL DEFAULT '',
  data_emissione TEXT,
  psp_riferimento TEXT NOT NULL DEFAULT '',
  causale TEXT NOT NULL DEFAULT '',
  cognome TEXT NOT NULL DEFAULT '',
  nome TEXT NOT NULL DEFAULT '',
  codice_fiscale TEXT NOT NULL DEFAULT '',
  tariffa_ridotta INTEGER NOT NULL DEFAULT 0,
  blocchetti_dovuti INTEGER NOT NULL,
  blocchetti_consegnati INTEGER NOT NULL DEFAULT 0,
  anno_scolastico TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_pagamenti_cf ON pagamenti (codice_fiscale);
`
