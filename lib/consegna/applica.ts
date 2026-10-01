import type { AzioneConsegna, Pagamento } from "@/lib/pagamenti/tipi"

export function applicaConsegna(
  pagamento: Pagamento,
  azione: AzioneConsegna,
): { ok: true; record: Pagamento } | { ok: false; messaggio: string } {
  if (!pagamento.dataPagamento) {
    return { ok: false, messaggio: "Il bollettino non è pagato: la consegna non è disponibile." }
  }

  if (azione === "completa") {
    if (pagamento.blocchettiConsegnati >= pagamento.blocchettiDovuti) {
      return { ok: false, messaggio: "I blocchetti sono già tutti consegnati." }
    }
    return {
      ok: true,
      record: { ...pagamento, blocchettiConsegnati: pagamento.blocchettiDovuti },
    }
  }

  if (azione === "parziale") {
    if (pagamento.blocchettiDovuti !== 2) {
      return {
        ok: false,
        messaggio: "La consegna di un blocchetto alla volta vale solo per i pagamenti da 2.",
      }
    }
    if (pagamento.blocchettiConsegnati >= pagamento.blocchettiDovuti) {
      return { ok: false, messaggio: "I blocchetti sono già tutti consegnati." }
    }
    return {
      ok: true,
      record: {
        ...pagamento,
        blocchettiConsegnati: pagamento.blocchettiConsegnati + 1,
      },
    }
  }

  if (pagamento.blocchettiConsegnati === 0) {
    return { ok: false, messaggio: "Non c'è una consegna da annullare." }
  }

  return {
    ok: true,
    record: { ...pagamento, blocchettiConsegnati: 0 },
  }
}
