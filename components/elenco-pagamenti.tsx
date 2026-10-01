import type { ReactNode } from "react"
import { cn } from "cn"
import { IntestazioneOrdine } from "@/components/intestazione-ordine"
import { Paginazione } from "@/components/paginazione"
import type { GruppoAudit } from "@/lib/audit/tipi"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatoPagamentoBadge } from "@/components/stato-pagamento"
import { TempiConsegna } from "@/components/tempi-consegna"
import { formatDataIt } from "@/lib/format/data-it"
import { formatEuro } from "@/lib/format/euro"
import { COLONNE_ELENCO, type ColonnaElenco, type OrdineElenco } from "@/lib/pagamenti/ordina"
import { chiaveVoce } from "@/lib/pagamenti/persona"
import { classeSfondoVoce } from "@/lib/pagamenti/sfondo-stato"
import type { FiltroElenco, RigaElenco } from "@/lib/pagamenti/tipi"
import { dataPiuRecente, statoGruppo, type VoceElenco } from "@/lib/pagamenti/voci"

export function ElencoPagamenti({
  voci,
  totale,
  filtrati,
  pagina,
  pagine,
  dal,
  al,
  onPagina,
  filtro,
  ricerca,
  caricamento,
  errore,
  pendingIuv,
  onRiprova,
  onApriPersona,
  azioni,
  azioniGruppo,
  ordine,
  onOrdina,
}: {
  voci: VoceElenco[]
  totale: number
  filtrati: number
  pagina: number
  pagine: number
  dal: number
  al: number
  onPagina: (pagina: number) => void
  filtro: FiltroElenco
  ricerca: string
  caricamento: boolean
  errore: string | null
  pendingIuv: string | null
  onRiprova: () => void
  onApriPersona: (chiave: string) => void
  azioni: (riga: RigaElenco) => ReactNode
  azioniGruppo: (gruppo: GruppoAudit) => ReactNode
  ordine: OrdineElenco | null
  onOrdina: (colonna: ColonnaElenco) => void
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

  if (voci.length === 0) {
    return (
      <p className="rounded-xl bg-card px-4 py-8 text-sm text-muted-foreground ring-1 ring-foreground/10">
        {messaggioVuoto(totale, filtro, ricerca)}
      </p>
    )
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1 md:hidden" role="group" aria-label="Ordina elenco">
        {COLONNE_ELENCO.map((colonna) => {
          const attiva = ordine?.colonna === colonna.id
          return (
            <Button
              key={colonna.id}
              type="button"
              size="sm"
              variant={attiva ? "default" : "outline"}
              onClick={() => onOrdina(colonna.id)}
            >
              {colonna.etichetta}
              {attiva ? (ordine.verso === "asc" ? " ↑" : " ↓") : ""}
            </Button>
          )
        })}
      </div>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {COLONNE_ELENCO.map((colonna) => (
                <IntestazioneOrdine
                  key={colonna.id}
                  colonna={colonna.id}
                  etichetta={colonna.etichetta}
                  ordine={ordine}
                  onOrdina={onOrdina}
                />
              ))}
              <TableHead>Azione</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {voci.map((voce) =>
              voce.tipo === "singola" ? (
                <TableRow
                  key={voce.id}
                  className={cn("cursor-pointer", classeSfondoVoce(voce))}
                  onClick={() => onApriPersona(chiaveVoce(voce))}
                >
                  <TableCell className="whitespace-normal font-medium">
                    <NomePersona nome={voce.riga.debitore} onApri={() => onApriPersona(chiaveVoce(voce))} />
                  </TableCell>
                  <TableCell>{formatEuro(voce.riga.importoCentesimi)}</TableCell>
                  <TableCell className="whitespace-normal">
                    <Blocchetti riga={voce.riga} />
                  </TableCell>
                  <TableCell>{formatDataIt(voce.riga.dataPagamento)}</TableCell>
                  <TableCell>{formatDataIt(voce.riga.dataScadenza)}</TableCell>
                  <TableCell className="font-mono text-xs">{voce.riga.iuv}</TableCell>
                  <TableCell>
                    <StatoPagamentoBadge stato={voce.riga.stato} />
                  </TableCell>
                  <TableCell onClick={(evento) => evento.stopPropagation()}>{azioni(voce.riga)}</TableCell>
                </TableRow>
              ) : (
                <RigaGruppo key={voce.id} voce={voce} onApri={onApriPersona} azioni={azioniGruppo} />
              ),
            )}
          </TableBody>
        </Table>
      </div>
      <ul className="flex flex-col gap-3 md:hidden">
        {voci.map((voce) =>
          voce.tipo === "singola" ? (
            <li
              key={voce.id}
              className={cn("cursor-pointer rounded-xl p-4 ring-1 ring-foreground/10", classeSfondoVoce(voce))}
              onClick={() => onApriPersona(chiaveVoce(voce))}
            >
              <div className="flex items-start justify-between gap-3">
                <NomePersona nome={voce.riga.debitore} onApri={() => onApriPersona(chiaveVoce(voce))} />
                <StatoPagamentoBadge stato={voce.riga.stato} />
              </div>
              <SchedaMobile
                importo={voce.riga.importoCentesimi}
                blocchetti={<Blocchetti riga={voce.riga} />}
                pagamento={voce.riga.dataPagamento}
                scadenza={voce.riga.dataScadenza}
                iuv={voce.riga.iuv}
              />
              <div className="mt-3" onClick={(evento) => evento.stopPropagation()}>
                {azioni(voce.riga)}
              </div>
              {pendingIuv === voce.riga.iuv ? <p className="mt-2 text-xs text-muted-foreground">Aggiornamento…</p> : null}
            </li>
          ) : (
            <li
              key={voce.id}
              className={cn("cursor-pointer rounded-xl p-4 ring-1 ring-foreground/10", classeSfondoVoce(voce))}
              onClick={() => onApriPersona(chiaveVoce(voce))}
            >
              <div className="flex items-start justify-between gap-3">
                <NomePersona nome={voce.gruppo.debitore} onApri={() => onApriPersona(chiaveVoce(voce))} />
                <StatoPagamentoBadge stato={statoGruppo(voce.gruppo)} />
              </div>
              <SchedaMobile
                importo={voce.gruppo.sommaCentesimi}
                blocchetti={
                  <BlocchettiGruppo
                    consegnati={voce.gruppo.consegnati}
                    dovuti={voce.gruppo.blocchetti}
                    tempi={voce.righe.flatMap((riga) => riga.consegneIl)}
                  />
                }
                pagamento={dataPiuRecente(voce.righe.map((riga) => riga.dataPagamento))}
                scadenza={dataPiuRecente(voce.righe.map((riga) => riga.dataScadenza))}
                iuv={etichettaIuv(voce.righe)}
              />
              <div className="mt-3 flex flex-wrap gap-1" onClick={(evento) => evento.stopPropagation()}>
                {voce.gruppo.esito === "anomalia" ? (
                  <Button type="button" size="sm" variant="destructive" onClick={() => onApriPersona(chiaveVoce(voce))}>
                    Anomalia
                  </Button>
                ) : null}
                {azioniGruppo(voce.gruppo)}
              </div>
            </li>
          ),
        )}
      </ul>
      <Paginazione pagina={pagina} pagine={pagine} dal={dal} al={al} totale={filtrati} onPagina={onPagina} />
    </div>
  )
}

function RigaGruppo({
  voce,
  onApri,
  azioni,
}: {
  voce: Extract<VoceElenco, { tipo: "gruppo" }>
  onApri: (chiave: string) => void
  azioni: (gruppo: GruppoAudit) => ReactNode
}) {
  const stato = statoGruppo(voce.gruppo)
  const chiave = chiaveVoce(voce)
  return (
    <TableRow className={cn("cursor-pointer", classeSfondoVoce(voce))} onClick={() => onApri(chiave)}>
      <TableCell className="whitespace-normal font-medium">
        <NomePersona nome={voce.gruppo.debitore} onApri={() => onApri(chiave)} />
      </TableCell>
      <TableCell>{formatEuro(voce.gruppo.sommaCentesimi)}</TableCell>
      <TableCell className="whitespace-normal">
        <BlocchettiGruppo
          consegnati={voce.gruppo.consegnati}
          dovuti={voce.gruppo.blocchetti}
          tempi={voce.righe.flatMap((riga) => riga.consegneIl)}
        />
      </TableCell>
      <TableCell>{formatDataIt(dataPiuRecente(voce.righe.map((riga) => riga.dataPagamento)))}</TableCell>
      <TableCell>{formatDataIt(dataPiuRecente(voce.righe.map((riga) => riga.dataScadenza)))}</TableCell>
      <TableCell className="font-mono text-xs">{etichettaIuv(voce.righe)}</TableCell>
      <TableCell>
        <StatoPagamentoBadge stato={stato} />
      </TableCell>
      <TableCell onClick={(evento) => evento.stopPropagation()}>
        <div className="flex flex-wrap gap-1">
          {voce.gruppo.esito === "anomalia" ? (
            <Button type="button" size="sm" variant="destructive" onClick={() => onApri(chiave)}>
              Anomalia
            </Button>
          ) : null}
          {azioni(voce.gruppo)}
        </div>
      </TableCell>
    </TableRow>
  )
}

function Blocchetti({ riga }: { riga: RigaElenco }) {
  return (
    <span className="whitespace-normal">
      {riga.blocchettiConsegnati}/{riga.blocchettiDovuti}
      {riga.tariffaRidotta ? <span className="ml-1 text-xs text-muted-foreground">ridotta</span> : null}
      <TempiConsegna tempi={riga.consegneIl} consegnati={riga.blocchettiConsegnati} />
    </span>
  )
}

function BlocchettiGruppo({
  consegnati,
  dovuti,
  tempi,
}: {
  consegnati: number
  dovuti: number
  tempi: string[]
}) {
  if (dovuti <= 0) return <span>—</span>
  return (
    <span className="whitespace-normal">
      {consegnati}/{dovuti}
      <TempiConsegna tempi={tempi} consegnati={consegnati} />
    </span>
  )
}

function NomePersona({ nome, onApri }: { nome: string; onApri: () => void }) {
  return (
    <button
      type="button"
      className="text-left font-medium underline-offset-2 hover:underline"
      onClick={(evento) => {
        evento.stopPropagation()
        onApri()
      }}
    >
      {nome}
    </button>
  )
}

function SchedaMobile({
  importo,
  blocchetti,
  pagamento,
  scadenza,
  iuv,
}: {
  importo: number
  blocchetti: ReactNode
  pagamento: string | null
  scadenza: string | null
  iuv: string
}) {
  return (
    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
      <Voce etichetta="Importo" valore={formatEuro(importo)} />
      <div>
        <dt className="text-muted-foreground">Blocchetti</dt>
        <dd>{blocchetti}</dd>
      </div>
      <Voce etichetta="Pagamento" valore={formatDataIt(pagamento)} />
      <Voce etichetta="Scadenza" valore={formatDataIt(scadenza)} />
      <div className="col-span-2">
        <dt className="text-muted-foreground">IUV</dt>
        <dd className="font-mono text-xs break-all">{iuv}</dd>
      </div>
    </dl>
  )
}

function Voce({ etichetta, valore }: { etichetta: string; valore: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{etichetta}</dt>
      <dd>{valore}</dd>
    </div>
  )
}

function etichettaIuv(righe: RigaElenco[]): string {
  if (righe.length <= 1) return righe[0]?.iuv ?? ""
  return `${righe.length} IUV`
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
