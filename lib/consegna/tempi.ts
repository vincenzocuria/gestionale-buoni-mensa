import { formatDataIt } from "@/lib/format/data-it"

export function adessoLocale(data = new Date()): string {
  const cifra = (n: number) => String(n).padStart(2, "0")
  return `${data.getFullYear()}-${cifra(data.getMonth() + 1)}-${cifra(data.getDate())}T${cifra(data.getHours())}:${cifra(data.getMinutes())}:${cifra(data.getSeconds())}`
}

export function leggiConsegne(valore: unknown): string[] {
  if (typeof valore !== "string" || valore === "") return []
  try {
    const letto = JSON.parse(valore) as unknown
    if (!Array.isArray(letto)) return []
    return letto.filter((voce): voce is string => typeof voce === "string" && voce !== "")
  } catch {
    return []
  }
}

export function scriviConsegne(tempi: string[]): string {
  return JSON.stringify(tempi)
}

export function allineaConsegne(attuali: string[], quanti: number, adesso: string): string[] {
  if (quanti <= 0) return []
  const tenuti = attuali.filter(Boolean).slice(0, quanti)
  while (tenuti.length < quanti) tenuti.push(adesso)
  return tenuti
}

export function testoConsegne(tempi: string[]): string {
  return tempi.map((iso) => formatDataIt(iso)).join(", ")
}
