import { allineaConsegne } from "@/lib/consegna/tempi"
import type { Pagamento } from "@/lib/pagamenti/tipi"

export function applicaConsegna(
  pagamento: Pagamento,
  azione: "completa" | "parziale" | "annulla",
  adesso: string,
  quanti: number | null = null,
): { ok: true; record: Pagamento } | { ok: false; messaggio: string } {
  if (!pagamento.dataPagamento) {
    return { ok: false, messaggio: "Il bollettino non è pagato: la consegna non è disponibile." }
  }

  if (azione === "completa") {
    if (pagamento.blocchettiConsegnati >= pagamento.blocchettiDovuti) {
      return { ok: false, messaggio: "I blocchetti sono già tutti consegnati." }
    }
    const residui = pagamento.blocchettiDovuti - pagamento.blocchettiConsegnati
    const consegnati = pagamento.blocchettiConsegnati + Math.min(residui, quanti ?? residui)
    return {
      ok: true,
      record: {
        ...pagamento,
        blocchettiConsegnati: consegnati,
        consegneIl: allineaConsegne(pagamento.consegneIl, consegnati, adesso),
      },
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
        consegneIl: allineaConsegne(pagamento.consegneIl, pagamento.blocchettiConsegnati + 1, adesso),
      },
    }
  }

  if (pagamento.blocchettiConsegnati === 0) {
    return { ok: false, messaggio: "Non c'è una consegna da annullare." }
  }

  return {
    ok: true,
    record: { ...pagamento, blocchettiConsegnati: 0, consegneIl: [] },
  }
}
