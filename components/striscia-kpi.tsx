import type { Kpi } from "@/lib/pagamenti/tipi"
import { formatEuro } from "@/lib/format/euro"
import { Card, CardContent } from "@/components/ui/card"

const VOCI: { chiave: keyof Kpi; etichetta: string; euro?: boolean }[] = [
  { chiave: "paganti", etichetta: "Paganti" },
  { chiave: "nonPaganti", etichetta: "Non paganti" },
  { chiave: "blocchettiDaConsegnare", etichetta: "Blocchetti da consegnare" },
  { chiave: "blocchettiConsegnati", etichetta: "Blocchetti consegnati" },
  { chiave: "incassatoCentesimi", etichetta: "Incassato", euro: true },
  { chiave: "daIncassareCentesimi", etichetta: "Da incassare", euro: true },
]

export function StrisciaKpi({ kpi }: { kpi: Kpi }) {
  return (
    <section aria-label="Riepilogo" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {VOCI.map((voce) => (
        <Card key={voce.chiave} size="sm">
          <CardContent className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{voce.etichetta}</span>
            <strong className="text-xl font-semibold tracking-tight">
              {voce.euro ? formatEuro(kpi[voce.chiave]) : kpi[voce.chiave]}
            </strong>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
