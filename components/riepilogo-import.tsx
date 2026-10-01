import type { RiepilogoImport as Riepilogo } from "@/lib/pagamenti/tipi"

const VOCI: { chiave: keyof Riepilogo; etichetta: string }[] = [
  { chiave: "nuovi", etichetta: "Nuovi" },
  { chiave: "aggiornati", etichetta: "Aggiornati" },
  { chiave: "ignorati", etichetta: "Ignorati perché completi" },
  { chiave: "invariati", etichetta: "Invariati" },
  { chiave: "esclusiTest", etichetta: "Esclusi test" },
  { chiave: "fuoriPeriodo", etichetta: "Prima di settembre 2026" },
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
