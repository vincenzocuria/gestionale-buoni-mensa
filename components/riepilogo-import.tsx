import { formatDataIt } from "@/lib/format/data-it"
import { formatEuro } from "@/lib/format/euro"
import type { RiepilogoImport as Riepilogo } from "@/lib/pagamenti/tipi"

const VOCI: { chiave: Exclude<keyof Riepilogo, "errori" | "mensaSuAltroServizio">; etichetta: string }[] = [
  { chiave: "nuovi", etichetta: "Nuovi" },
  { chiave: "aggiornati", etichetta: "Aggiornati" },
  { chiave: "ignorati", etichetta: "Ignorati perché completi" },
  { chiave: "invariati", etichetta: "Invariati" },
  { chiave: "esclusiTest", etichetta: "Esclusi test" },
  { chiave: "fuoriPeriodo", etichetta: "Prima di settembre 2026" },
  { chiave: "altriServizi", etichetta: "Altri servizi (non mensa)" },
]

export function RiepilogoImport({ riepilogo }: { riepilogo: Riepilogo }) {
  return (
    <section className="rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10" aria-live="polite">
      <p className="text-sm font-medium">Riepilogo import · {riepilogo.righeLette} righe lette</p>
      <dl className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {VOCI.map((voce) => (
          <div key={voce.chiave} className="flex gap-1">
            <dt className="text-muted-foreground">{voce.etichetta}</dt>
            <dd className="font-semibold">{Number(riepilogo[voce.chiave])}</dd>
          </div>
        ))}
      </dl>
      {riepilogo.mensaSuAltroServizio.length > 0 ? (
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950 ring-1 ring-amber-300 dark:bg-amber-950/40 dark:text-amber-100">
          <p className="font-medium">
            Mensa pagata su un altro servizio · {riepilogo.mensaSuAltroServizio.length}
          </p>
          <p className="mt-0.5 text-xs">
            Hanno scritto «mensa» nella causale ma hanno pagato un altro servizio: il pagamento non è agganciato
            alla mensa e non entra nel registro. Vanno gestiti a mano.
          </p>
          <ul className="mt-2 space-y-1">
            {riepilogo.mensaSuAltroServizio.map((caso) => (
              <li key={caso.iuv} className="flex flex-wrap gap-x-3">
                <span className="font-medium">{caso.debitore}</span>
                <span>{formatEuro(caso.importoCentesimi)}</span>
                <span>{caso.dataPagamento ? formatDataIt(caso.dataPagamento) : "non pagato"}</span>
                <span>{caso.servizio}</span>
                <span className="text-xs opacity-80">«{caso.causale}» · IUV {caso.iuv}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {riepilogo.errori.length > 0 ? (
        <ul className="mt-2 list-disc pl-5 text-sm text-destructive">
          {riepilogo.errori.slice(0, 8).map((errore) => (
            <li key={errore}>{errore}</li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
