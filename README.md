# Buoni mensa — San Lorenzo del Vallo

Registro delle consegne dei blocchetti della mensa scolastica. L’export Siscom (`StampaRicerca`, separatore `;`) si importa dalla pagina e si fonde sull’IUV: i bollettini già chiusi restano com’erano, quelli non pagati si aggiornano, la consegna non si azzera.

## Ufficio

Il sito è [https://mensa.vcuria.app](https://mensa.vcuria.app). I PC dell’ufficio lo aprono nel browser.

L’app gira in un container Docker su Coolify (vedi `Dockerfile`: build standalone di Next.js, utente non root, porta 3000, controllo di salute su `/api/salute`). I dati stanno nel database PostgreSQL del Comune (istanza Supabase self-hosted), raggiunto in LAN: schema `mensa`, ruolo dedicato `mensa_app` che può solo leggere e scrivere le righe delle proprie tabelle.

Variabili d’ambiente del container:

- `UFFICIO_PASSWORD` — password dell’ufficio
- `MENSA_DATABASE_URL` — es. `postgres://mensa_app:PASSWORD@192.168.1.40:5432/postgres`
- `MENSA_DATABASE_SSL` — facoltativa: `require` solo se il database è raggiunto da una rete non fidata
- `MENSA_DATABASE_POOL` — facoltativa: connessioni massime (predefinito 5)

La password non è nel codice. Senza `UFFICIO_PASSWORD` l’accesso resta chiuso. Senza `MENSA_DATABASE_URL` l’app risponde «Database non configurato».

### Schema del database

Lo schema non si crea all’avvio: si applicano le migrazioni in `db/migrazioni` con un utente amministratore, una volta e a ogni aggiornamento che ne aggiunge. Sono idempotenti.

```bash
MENSA_DATABASE_ADMIN_URL=postgres://postgres:...@192.168.1.40:5432/postgres \
MENSA_APP_DB_PASSWORD=... \
npm run migra
```

`MENSA_APP_DB_PASSWORD` imposta la password del ruolo `mensa_app` (la stessa da mettere in `MENSA_DATABASE_URL`). Dal container: `node scripts/migra.mjs` con le stesse variabili.

Dopo aver copiato dati da un database precedente, `select mensa.compila_anno_scolastico();` (come amministratore) assegna l’anno scolastico ai bollettini che non lo hanno ancora, con la stessa regola dell’import.

## Avvio in locale

```bash
npm install
```

Serve un PostgreSQL (16 o successivo). Creare `.env.local` (non va committato) partendo da `.env.example`, con `UFFICIO_PASSWORD` e `MENSA_DATABASE_URL`, e applicare le migrazioni con `npm run migra` (con `MENSA_DATABASE_ADMIN_URL` e `MENSA_APP_DB_PASSWORD` nell’ambiente, come sopra).

Per avere dei dati di prova, con un export in `data/StampaRicerca.csv` e il registro vuoto:

```bash
MENSA_DATABASE_URL=... npm run sviluppo:importa
```

La cartella `data/` resta fuori da git: contiene codici fiscali.

```bash
npm run dev
```

Il server ascolta su `0.0.0.0` alla porta `43123`. Da questo PC: http://127.0.0.1:43123

Per provarlo in rete locale dagli altri PC: `http://IP-DI-QUESTO-PC:43123`. Su Windows, una tantum, consentire la porta 43123 nel firewall.

La stessa porta vale per il server di produzione locale:

```bash
npm run build
npm start
```

Gli aggiornamenti successivi si fanno con il pulsante «Importa CSV».

## Verifiche

```bash
npm run lint
npm run typecheck
TEST_DATABASE_ADMIN_URL=postgres://postgres:...@localhost:5432/postgres npm test
npm run build
```

I test che usano il database creano un database usa e getta, vi applicano le migrazioni e si collegano come `mensa_app`; senza `TEST_DATABASE_ADMIN_URL` vengono saltati. In CI (`.github/workflows/ci.yml`) girano su un PostgreSQL 16 di servizio.
