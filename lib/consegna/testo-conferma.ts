export function testoConfermaConsegna(debitore: string, quanti: number, accorpato = false): string {
  const cosa = quanti === 1 ? "1 blocchetto" : `${quanti} blocchetti`
  const base = `Confermi la consegna di ${cosa} a ${debitore}?`
  if (!accorpato) return base
  return `${base} I versamenti accorpati contano come ${cosa}.`
}
