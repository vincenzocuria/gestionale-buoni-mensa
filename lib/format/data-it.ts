export function formatDataIt(iso: string | null): string {
  if (!iso) return "—"
  const [data, ora] = iso.split("T")
  const [anno, mese, giorno] = data.split("-")
  if (!anno || !mese || !giorno) return iso
  const base = `${giorno}/${mese}/${anno}`
  if (!ora) return base
  const [ore, minuti] = ora.split(":")
  return `${base} ${ore}:${minuti}`
}
