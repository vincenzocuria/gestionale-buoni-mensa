-- Buoni mensa: registro dei bollettini Siscom e limitazione dei tentativi di accesso.
-- Eseguire come amministratore del database (npm run migra, oppure dallo Studio Supabase).
-- Idempotente: può essere rieseguito.
--
-- Nomi di tabelle e colonne identici al database SQLite di origine:
-- l'importatore copia i dati confrontando i nomi. Le date restano testo ISO
-- ("2026-09-01" oppure "2026-10-02T09:00:00", ora di Roma senza fuso) come prima,
-- perché il codice le confronta e le formatta come stringhe.

create schema if not exists mensa;

-- Ruolo applicativo dedicato: vede solo lo schema mensa, nessun DDL.
-- La password si imposta a parte (npm run migra con MENSA_APP_DB_PASSWORD).
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'mensa_app') then
    create role mensa_app login noinherit;
  end if;
end $$;

revoke all on schema mensa from public;
grant usage on schema mensa to mensa_app;
alter role mensa_app set search_path = mensa;

create table if not exists mensa.migrazioni (
  versione text primary key,
  applicata_il timestamptz not null default now()
);

-- Bollettini (uno per IUV) -------------------------------------------------
create table if not exists mensa.pagamenti (
  iuv text primary key,
  data_scadenza text,
  data_pagamento text,
  servizio text not null default '',
  tipologia text not null default '',
  importo_centesimi integer not null,
  debitore text not null default '',
  accertamento_anno text not null default '',
  accertamento_numero text not null default '',
  reversale_data text,
  reversale_numero text not null default '',
  data_emissione text,
  psp_riferimento text not null default '',
  causale text not null default '',
  cognome text not null default '',
  nome text not null default '',
  codice_fiscale text not null default '',
  -- 0/1 come in SQLite (il codice legge "= 1").
  tariffa_ridotta integer not null default 0,
  blocchetti_dovuti integer not null,
  blocchetti_consegnati integer not null default 0,
  anno_scolastico text not null default '',
  -- Array JSON degli orari di consegna, salvato come testo come in SQLite.
  consegne_il text not null default '[]'
);
create index if not exists idx_pagamenti_cf on mensa.pagamenti (codice_fiscale);

-- Colonne aggiunte nel tempo a runtime (assicuraAnnoScolastico, assicuraConsegne):
-- su un database creato prima di quelle versioni le aggiunge.
alter table mensa.pagamenti add column if not exists anno_scolastico text not null default '';
alter table mensa.pagamenti add column if not exists consegne_il text not null default '[]';

-- Tentativi di accesso falliti per IP --------------------------------------
create table if not exists mensa.tentativi_accesso (
  ip text primary key,
  tentativi integer not null default 0,
  -- Millisecondi dall'epoca Unix: non sta in un integer a 32 bit.
  bloccato_fino_ms bigint not null default 0
);

-- Anno scolastico dei bollettini che non lo hanno ancora -------------------
-- Stessa regola di lib/anno-scolastico/calcola.ts (etichettaImportabile):
-- prima data presente fra scadenza, emissione e pagamento; da settembre inizia
-- l'anno; solo dal 2026/2027 in poi. Prima la faceva assicuraAnnoScolastico a
-- ogni avvio; ora va eseguita una tantum dall'amministratore dopo aver copiato
-- i dati (select mensa.compila_anno_scolastico();). Restituisce le righe aggiornate.
create or replace function mensa.compila_anno_scolastico() returns integer
language sql as $$
  with base as (
    select iuv,
      substring(coalesce(nullif(data_scadenza, ''), nullif(data_emissione, ''), nullif(data_pagamento, ''))
        from '^(\d{4}-\d{2}-\d{2})') as giorno
    from mensa.pagamenti
    where anno_scolastico = ''
  ), parti as (
    select iuv, substr(giorno, 1, 4)::int as anno, substr(giorno, 6, 2)::int as mese, substr(giorno, 9, 2)::int as gg
    from base
    where giorno is not null
  ), etichette as (
    select iuv, case when mese >= 9 then anno else anno - 1 end as inizio
    from parti
    where mese between 1 and 12 and gg between 1 and 31
  ), aggiornate as (
    update mensa.pagamenti p
    set anno_scolastico = e.inizio::text || '/' || (e.inizio + 1)::text
    from etichette e
    where p.iuv = e.iuv and e.inizio >= 2026
    returning 1
  )
  select count(*)::int from aggiornate
$$;
revoke all on function mensa.compila_anno_scolastico() from public;
select mensa.compila_anno_scolastico();

-- Privilegi del ruolo applicativo: solo DML -------------------------------
grant select, insert, update, delete on mensa.pagamenti, mensa.tentativi_accesso to mensa_app;
grant usage on all sequences in schema mensa to mensa_app;

insert into mensa.migrazioni (versione) values ('001_mensa') on conflict do nothing;
