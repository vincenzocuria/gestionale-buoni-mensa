import { formatDataIt } from "@/lib/format/data-it"

export function TempiConsegna({ tempi, consegnati }: { tempi: string[]; consegnati: number }) {
  if (consegnati <= 0) return null
  if (tempi.length === 0) {
    return <span className="mt-0.5 block text-xs text-muted-foreground">Orario non registrato</span>
  }
  return (
    <span className="mt-0.5 block text-xs whitespace-normal text-muted-foreground">
      {tempi.map((iso, indice) => (
        <span key={`${iso}-${indice}`} className="block">
          {formatDataIt(iso)}
        </span>
      ))}
    </span>
  )
}
