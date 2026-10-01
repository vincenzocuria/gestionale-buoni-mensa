export function senzaApiceIniziale(valore: string): string {
  return valore.trim().replace(/^'+/, "")
}

export function parseDataSiscom(valore: string): string | null {
  const testo = valore.trim()
  if (!testo) return null
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(testo)
  if (!match) return null
  const giorno = Number(match[1])
  const mese = Number(match[2])
  if (giorno < 1 || giorno > 31 || mese < 1 || mese > 12) return null
  const data = `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`
  if (!match[4]) return data
  return `${data}T${match[4]}:${match[5]}:${match[6] ?? "00"}`
}

export function parseImportoCentesimi(valore: string): number | null {
  const raw = valore.trim().replace(/\s/g, "")
  if (!raw) return null
  const normalizzato = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw
  if (!/^-?\d+(\.\d+)?$/.test(normalizzato)) return null
  const numero = Number(normalizzato)
  if (!Number.isFinite(numero)) return null
  return Math.round(numero * 100)
}
