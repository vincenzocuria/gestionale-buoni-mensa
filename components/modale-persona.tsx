import type { ReactNode } from "react"
import { DialogModale } from "@/components/dialog-modale"
import { StatoPagamentoBadge } from "@/components/stato-pagamento"
import { TempiConsegna } from "@/components/tempi-consegna"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDataIt } from "@/lib/format/data-it"
import { formatEuro } from "@/lib/format/euro"
import type { StoricoPersona } from "@/lib/pagamenti/storico"
import type { SchedaPersona } from "@/lib/pagamenti/persona"
import type { GruppoAudit } from "@/lib/audit/tipi"
import type { RigaElenco } from "@/lib/pagamenti/tipi"
import { dataPiuRecente, statoGruppo, type VoceElenco } from "@/lib/pagamenti/voci"

export function ModalePersona({
  storico,
  onChiudi,
  azioni,
  azioniGruppo,
}: {
  storico: StoricoPersona
  onChiudi: () => void
  azioni: (riga: RigaElenco) => ReactNode
  azioniGruppo: (gruppo: GruppoAudit) => ReactNode
}) {
  return (
    <DialogModale className="w-[min(44rem,calc(100%-2rem))]" onChiudi={onChiudi}>
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="font-medium">{storico.debitore}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {storico.codiceFiscale || "Senza codice fiscale"} · {storico.anni.length === 1 ? "1 anno" : `${storico.anni.length} anni`}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onChiudi}>
          Chiudi
        </Button>
      </div>
      <div className="max-h-[70vh] overflow-auto px-4 py-3">
        <StoricoConsegne consegne={storico.consegne} />
        <div className="mt-4 flex flex-col gap-5">
          {storico.anni.map((scheda) => (
            <AnnoScheda key={scheda.annoScolastico} scheda={scheda} azioni={azioni} azioniGruppo={azioniGruppo} />
          ))}
        </div>
      </div>
    </DialogModale>
  )
}

function StoricoConsegne({ consegne }: { consegne: StoricoPersona["consegne"] }) {
  return (
    <section>
      <h3 className="text-sm font-medium">Storico consegne</h3>
      {consegne.length === 0 ? (
        <p className="mt-1 text-sm text-muted-foreground">Nessun orario di consegna registrato.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {consegne.map((voce, indice) => (
            <li key={`${voce.iuv}-${voce.quando}-${indice}`}>
              {formatDataIt(voce.quando)} · anno {voce.annoScolastico} · IUV {voce.iuv}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function AnnoScheda({
  scheda,
  azioni,
  azioniGruppo,
}: {
  scheda: SchedaPersona
  azioni: (riga: RigaElenco) => ReactNode
  azioniGruppo: (gruppo: GruppoAudit) => ReactNode
}) {
  return (
    <section>
      <h3 className="text-sm font-medium">Anno {scheda.annoScolastico}</h3>
      <p className="mt-1 text-sm">
        {scheda.consegnati}/{scheda.dovuti} blocchetti consegnati
        {scheda.daConsegnare > 0 ? ` · ${scheda.daConsegnare} da consegnare` : ""}
      </p>
      {scheda.voci.length > 1 ? (
        <p className="mt-1 text-sm text-muted-foreground">
          Ogni pagamento resta distinto: un acquisto nuovo compare qui come bollettino ancora da consegnare.
        </p>
      ) : null}
      <ul className="mt-3 flex flex-col gap-3">
        {scheda.voci.map((voce) => (
          <li key={voce.id} className="rounded-xl p-3 ring-1 ring-foreground/10">
            {voce.tipo === "singola" ? (
              <PagamentoSingolo voce={voce} azioni={azioni} />
            ) : (
              <PagamentoGruppo voce={voce} azioni={azioniGruppo} />
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

function PagamentoSingolo({
  voce,
  azioni,
}: {
  voce: Extract<VoceElenco, { tipo: "singola" }>
  azioni: (riga: RigaElenco) => ReactNode
}) {
  const riga = voce.riga
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium">{formatEuro(riga.importoCentesimi)}</p>
        <StatoPagamentoBadge stato={riga.stato} />
      </div>
      <Dettaglio
        pagamento={riga.dataPagamento}
        scadenza={riga.dataScadenza}
        iuv={riga.iuv}
        etichettaConteggio="Blocchetti"
        conteggio={`${riga.blocchettiConsegnati}/${riga.blocchettiDovuti}`}
        tempi={riga.consegneIl}
        consegnati={riga.blocchettiConsegnati}
      />
      <div className="mt-3">{azioni(riga)}</div>
    </div>
  )
}

function PagamentoGruppo({
  voce,
  azioni,
}: {
  voce: Extract<VoceElenco, { tipo: "gruppo" }>
  azioni: (gruppo: GruppoAudit) => ReactNode
}) {
  const anomalia = voce.gruppo.esito === "anomalia"
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm">{voce.gruppo.testo}</p>
        {anomalia ? <Badge variant="destructive">Anomalia</Badge> : <StatoPagamentoBadge stato={statoGruppo(voce.gruppo)} />}
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {voce.righe.map((riga) => (
          <li key={riga.iuv} className="border-t border-border pt-2">
            <Dettaglio
              pagamento={riga.dataPagamento}
              scadenza={riga.dataScadenza}
              iuv={riga.iuv}
              etichettaConteggio="Importo"
              conteggio={formatEuro(riga.importoCentesimi)}
              tempi={riga.consegneIl}
              consegnati={Math.max(riga.blocchettiConsegnati, riga.consegneIl.length)}
            />
          </li>
        ))}
      </ul>
      {anomalia ? null : (
        <p className="mt-2 text-sm text-muted-foreground">
          Insieme valgono {formatEuro(voce.gruppo.sommaCentesimi)}, pagati il{" "}
          {formatDataIt(dataPiuRecente(voce.righe.map((riga) => riga.dataPagamento)))}.
        </p>
      )}
      <div className="mt-3">{azioni(voce.gruppo)}</div>
    </div>
  )
}

function Dettaglio({
  pagamento,
  scadenza,
  iuv,
  etichettaConteggio,
  conteggio,
  tempi,
  consegnati,
}: {
  pagamento: string | null
  scadenza: string | null
  iuv: string
  etichettaConteggio: string
  conteggio: string
  tempi: string[]
  consegnati: number
}) {
  return (
    <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
      <Voce etichetta="Pagamento" valore={formatDataIt(pagamento)} />
      <Voce etichetta="Scadenza" valore={formatDataIt(scadenza)} />
      <div>
        <dt className="text-muted-foreground">{etichettaConteggio}</dt>
        <dd>
          {conteggio}
          <TempiConsegna tempi={tempi} consegnati={consegnati} />
        </dd>
      </div>
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
