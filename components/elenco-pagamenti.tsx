import type { ReactNode } from "react"
import { Paginazione } from "@/components/paginazione"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { EsitoAuditRiga } from "@/lib/audit/tipi"
import { formatDataIt } from "@/lib/format/data-it"
import { formatEuro } from "@/lib/format/euro"
import { ETICHETTA_STATO } from "@/lib/pagamenti/stato"
import type { FiltroElenco, RigaElenco } from "@/lib/pagamenti/tipi"

export type SchedaRiga = { esito: EsitoAuditRiga; testo: string }

export function ElencoPagamenti({
  righe,
  totale,
  filtrati,
  pagina,
  pagine,
  dal,
  al,
  onPagina,
  audit,
  filtro,
  ricerca,
  caricamento,
  errore,
  pendingIuv,
  onRiprova,
  azioni,
}: {
  righe: RigaElenco[]
  totale: number
  filtrati: number
  pagina: number
  pagine: number
  dal: number
  al: number
  onPagina: (pagina: number) => void
  audit: Map<string, SchedaRiga>
  filtro: FiltroElenco
  ricerca: string
  caricamento: boolean
  errore: string | null
  pendingIuv: string | null
  onRiprova: () => void
  azioni: (riga: RigaElenco) => ReactNode
}) {
  if (caricamento) {
    return (
      <p className="py-10 text-sm text-muted-foreground" role="status">
        Caricamento del registro…
      </p>
    )
  }

  if (errore) {
    return (
      <div className="rounded-xl bg-destructive/10 px-4 py-4 text-sm" role="alert">
        <p>{errore}</p>
        <Button type="button" className="mt-3" variant="outline" onClick={onRiprova}>
          Riprova
        </Button>
      </div>
    )
  }

  if (righe.length === 0) {
    return (
      <p className="rounded-xl bg-card px-4 py-8 text-sm text-muted-foreground ring-1 ring-foreground/10">
        {messaggioVuoto(totale, filtro, ricerca)}
      </p>
    )
  }

  return (
    <div>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Debitore</TableHead>
              <TableHead>Importo</TableHead>
              <TableHead>Blocchetti</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Scadenza</TableHead>
              <TableHead>IUV</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Azione</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {righe.map((riga) => (
              <TableRow key={riga.iuv}>
                <TableCell className="whitespace-normal font-medium">
                  <Debitore riga={riga} scheda={audit.get(riga.iuv)} />
                </TableCell>
                <TableCell>{formatEuro(riga.importoCentesimi)}</TableCell>
                <TableCell>
                  <Blocchetti riga={riga} />
                </TableCell>
                <TableCell>{formatDataIt(riga.dataPagamento)}</TableCell>
                <TableCell>{formatDataIt(riga.dataScadenza)}</TableCell>
                <TableCell className="font-mono text-xs">{riga.iuv}</TableCell>
                <TableCell>
                  <Stato riga={riga} />
                </TableCell>
                <TableCell>{azioni(riga)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="flex flex-col gap-3 md:hidden">
        {righe.map((riga) => (
          <li key={riga.iuv} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
            <div className="flex items-start justify-between gap-3">
              <Debitore riga={riga} scheda={audit.get(riga.iuv)} />
              <Stato riga={riga} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <Voce etichetta="Importo" valore={formatEuro(riga.importoCentesimi)} />
              <div>
                <dt className="text-muted-foreground">Blocchetti</dt>
                <dd>
                  <Blocchetti riga={riga} />
                </dd>
              </div>
              <Voce etichetta="Pagamento" valore={formatDataIt(riga.dataPagamento)} />
              <Voce etichetta="Scadenza" valore={formatDataIt(riga.dataScadenza)} />
              <div className="col-span-2">
                <dt className="text-muted-foreground">IUV</dt>
                <dd className="font-mono text-xs break-all">{riga.iuv}</dd>
              </div>
            </dl>
            <div className="mt-3">{azioni(riga)}</div>
            {pendingIuv === riga.iuv ? <p className="mt-2 text-xs text-muted-foreground">Aggiornamento…</p> : null}
          </li>
        ))}
      </ul>
      <Paginazione pagina={pagina} pagine={pagine} dal={dal} al={al} totale={filtrati} onPagina={onPagina} />
    </div>
  )
}

function Debitore({ riga, scheda }: { riga: RigaElenco; scheda?: SchedaRiga }) {
  const segnala = scheda && (scheda.esito === "anomalia" || scheda.esito === "accorpato")
  return (
    <div>
      <p className="font-medium">{riga.debitore}</p>
      {segnala ? (
        <p className={scheda.esito === "anomalia" ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
          {scheda.testo}
        </p>
      ) : null}
    </div>
  )
}

function Blocchetti({ riga }: { riga: RigaElenco }) {
  return (
    <span>
      {riga.blocchettiConsegnati}/{riga.blocchettiDovuti}
      {riga.tariffaRidotta ? <span className="ml-1 text-xs text-muted-foreground">ridotta</span> : null}
    </span>
  )
}

function Stato({ riga }: { riga: RigaElenco }) {
  const variante = riga.stato === "consegnato" ? "secondary" : riga.stato === "non_pagato" ? "outline" : "default"
  return <Badge variant={variante}>{ETICHETTA_STATO[riga.stato]}</Badge>
}

function Voce({ etichetta, valore }: { etichetta: string; valore: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{etichetta}</dt>
      <dd>{valore}</dd>
    </div>
  )
}

function messaggioVuoto(totale: number, filtro: FiltroElenco, ricerca: string): string {
  if (totale === 0) return "Nessun bollettino in archivio. Importa un export Siscom (StampaRicerca)."
  if (ricerca.trim()) return "Nessun bollettino corrisponde a questa ricerca."
  if (filtro === "non_paganti") return "Nessun bollettino da incassare."
  if (filtro === "consegnati") return "Nessun blocchetto risulta consegnato."
  if (filtro === "da_consegnare") return "Nessun blocchetto da consegnare."
  if (filtro === "paganti") return "Nessun bollettino pagato."
  return "Nessun bollettino in elenco."
}
