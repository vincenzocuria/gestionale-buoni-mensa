# Buoni mensa — San Lorenzo del Vallo

Registro delle consegne dei blocchetti della mensa scolastica. L’export Siscom (`StampaRicerca`, separatore `;`) si importa dalla pagina e si fonde sull’IUV: i bollettini già chiusi restano com’erano, quelli non pagati si aggiornano, la consegna non si azzera.

## Ufficio

Il sito è [https://mensa.vcuria.app](https://mensa.vcuria.app). I PC dell’ufficio lo aprono nel browser. I dati di produzione stanno su Turso, piano gratuito. L’app è su Vercel, già nel piano in uso: nessun altro servizio a pagamento.

Sul DNS Cloudflare di `vcuria.app` serve solo un CNAME sull’host `mensa`, verso Vercel. Il record dell’apex `vcuria.app` non va modificato.

Variabili d’ambiente in produzione:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `UFFICIO_PASSWORD`

La password non è nel codice. Senza `UFFICIO_PASSWORD` l’accesso resta chiuso.

## Avvio in locale

```bash
npm install
```

Creare `.env.local` (non va committato) con la variabile `UFFICIO_PASSWORD`.

Se `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` non sono impostate, il database è il file `data/mensa.sqlite`.

Al primo avvio, se il database è vuoto e in `data/StampaRicerca.csv` c’è un export, quello viene importato. La cartella `data/` resta fuori da git: contiene codici fiscali.

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
