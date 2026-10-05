const FUSO = "Europe/Rome"

const formato = new Intl.DateTimeFormat("en-GB", {
  timeZone: FUSO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
})

export function isoOraItalia(data = new Date()): string {
  const parti = partiItalia(data)
  return `${parti.anno}-${parti.mese}-${parti.giorno}T${parti.ore}:${parti.minuti}:${parti.secondi}`
}

export function isoGiornoItalia(data = new Date()): string {
  const parti = partiItalia(data)
  return `${parti.anno}-${parti.mese}-${parti.giorno}`
}

function partiItalia(data: Date): {
  anno: string
  mese: string
  giorno: string
  ore: string
  minuti: string
  secondi: string
} {
  const mappa = new Map(formato.formatToParts(data).map((parte) => [parte.type, parte.value]))
  return {
    anno: mappa.get("year") ?? "",
    mese: mappa.get("month") ?? "",
    giorno: mappa.get("day") ?? "",
    ore: (mappa.get("hour") ?? "").padStart(2, "0"),
    minuti: (mappa.get("minute") ?? "").padStart(2, "0"),
    secondi: (mappa.get("second") ?? "").padStart(2, "0"),
  }
}
