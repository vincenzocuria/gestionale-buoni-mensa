export function testoConfermaConsegna(debitore: string, quanti: number, accorpato = false): string {
  const cosa = quanti === 1 ? "1 blocchetto" : `${quanti} blocchetti`
  const base = `Confermi la consegna di ${cosa} a ${debitore}?`
  if (!accorpato) return base
  return `${base} I versamenti accorpati contano come ${cosa}.`
}

export function testoConfermaAnnulla(debitore: string, quanti: number): string {
  if (quanti === 1) {
    return `Annulli la consegna di 1 blocchetto a ${debitore}? Il blocchetto torna da consegnare. Il pagamento resta.`
  }
  return `Annulli le consegne di ${quanti} blocchetti a ${debitore}? I blocchetti tornano da consegnare. Il pagamento resta.`
}

export function testoConfermaRimozione(quando: string): string {
  return `Togli la consegna del ${quando}?`
}
