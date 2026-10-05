import type { Pagamento } from "@/lib/pagamenti/tipi"

export function normalizzaQuando(valore: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(valore.trim())
  if (!match) return null
  const anno = Number(match[1])
  const mese = Number(match[2])
  const giorno = Number(match[3])
  const ore = Number(match[4])
  const minuti = Number(match[5])
  const secondi = Number(match[6] ?? "0")
  if (mese < 1 || mese > 12 || ore > 23 || minuti > 59 || secondi > 59) return null
  const prova = new Date(anno, mese - 1, giorno, ore, minuti, secondi)
  if (prova.getFullYear() !== anno || prova.getMonth() !== mese - 1 || prova.getDate() !== giorno) return null
  const cifra = (n: number) => String(n).padStart(2, "0")
  return `${anno}-${cifra(mese)}-${cifra(giorno)}T${cifra(ore)}:${cifra(minuti)}:${cifra(secondi)}`
}

export function modificaIstante(
  tempi: string[],
  indice: number,
  quando: string,
): { ok: true; tempi: string[] } | { ok: false; messaggio: string } {
  if (!Number.isInteger(indice) || indice < 0 || indice >= tempi.length) {
    return { ok: false, messaggio: "Consegna non trovata." }
  }
  const iso = normalizzaQuando(quando)
  if (!iso) return { ok: false, messaggio: "Data o ora non valide." }
  const copia = tempi.slice()
  copia[indice] = iso
  return { ok: true, tempi: copia }
}

export function rimuoviIstante(
  tempi: string[],
  indice: number,
  consegnati: number,
): { ok: true; tempi: string[]; consegnati: number } | { ok: false; messaggio: string } {
  if (!Number.isInteger(indice) || indice < 0 || indice >= tempi.length) {
    return { ok: false, messaggio: "Consegna non trovata." }
  }
  const copia = tempi.slice()
  copia.splice(indice, 1)
  return { ok: true, tempi: copia, consegnati: Math.max(0, consegnati - 1) }
}

export function aggiungiIstante(
  tempi: string[],
  quando: string,
  massimo: number,
  consegnati: number,
): { ok: true; tempi: string[]; consegnati: number } | { ok: false; messaggio: string } {
  if (massimo <= 0) return { ok: false, messaggio: "Non ci sono blocchetti da consegnare." }
  if (consegnati >= massimo) return { ok: false, messaggio: "I blocchetti sono già tutti consegnati." }
  const iso = normalizzaQuando(quando)
  if (!iso) return { ok: false, messaggio: "Data o ora non valide." }
  return { ok: true, tempi: [...tempi, iso], consegnati: consegnati + 1 }
}

export function applicaOrario(
  pagamento: Pagamento,
  azione: "modifica" | "rimuovi" | "registra",
  indice: number | null,
  quando: string | null,
): { ok: true; record: Pagamento } | { ok: false; messaggio: string } {
  if (!pagamento.dataPagamento) {
    return { ok: false, messaggio: "Il bollettino non è pagato: la consegna non è disponibile." }
  }
  if (pagamento.blocchettiDovuti <= 0) {
    return { ok: false, messaggio: "La consegna non è disponibile su questo bollettino." }
  }

  if (azione === "registra") {
    const esito = aggiungiIstante(
      pagamento.consegneIl,
      quando ?? "",
      pagamento.blocchettiDovuti,
      pagamento.blocchettiConsegnati,
    )
    if (!esito.ok) return esito
    return {
      ok: true,
      record: { ...pagamento, consegneIl: esito.tempi, blocchettiConsegnati: esito.consegnati },
    }
  }

  if (azione === "modifica") {
    const esito = modificaIstante(pagamento.consegneIl, indice ?? -1, quando ?? "")
    if (!esito.ok) return esito
    return { ok: true, record: { ...pagamento, consegneIl: esito.tempi } }
  }

  const esito = rimuoviIstante(pagamento.consegneIl, indice ?? -1, pagamento.blocchettiConsegnati)
  if (!esito.ok) return esito
  return {
    ok: true,
    record: { ...pagamento, consegneIl: esito.tempi, blocchettiConsegnati: esito.consegnati },
  }
}
