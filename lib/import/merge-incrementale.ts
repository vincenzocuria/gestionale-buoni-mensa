import { etichettaImportabile } from "@/lib/anno-scolastico/calcola"
import { calcolaBlocchetti } from "@/lib/blocchetti/calcola"
import { eRigaTest } from "@/lib/import/riga-test"
import type { EsitoMerge, Pagamento, RigaSiscom } from "@/lib/pagamenti/tipi"

export function applicaMerge(
  esistente: Pagamento | null,
  riga: RigaSiscom,
): { esito: EsitoMerge; record: Pagamento | null } {
  if (eRigaTest(riga.importoCentesimi, riga.causale)) {
    return { esito: "escluso_test", record: null }
  }

  if (!esistente) {
    return { esito: "nuovo", record: nuovoPagamento(riga) }
  }

  const pagato = Boolean(esistente.dataPagamento)
  const completo =
    pagato &&
    esistente.blocchettiDovuti > 0 &&
    esistente.blocchettiConsegnati >= esistente.blocchettiDovuti

  if (completo) return { esito: "ignorato", record: null }

  const prossimo = pagato ? compilaCampiVuoti(esistente, riga) : aggiornaAperto(esistente, riga)
  if (uguale(esistente, prossimo)) return { esito: "invariato", record: null }
  return { esito: "aggiornato", record: prossimo }
}

function nuovoPagamento(riga: RigaSiscom): Pagamento {
  const blocchetti = calcolaBlocchetti(riga.importoCentesimi)
  return {
    ...riga,
    annoScolastico: etichettaImportabile(riga) ?? "",
    tariffaRidotta: blocchetti.tariffaRidotta,
    blocchettiDovuti: blocchetti.dovuti,
    blocchettiConsegnati: 0,
  }
}

function aggiornaAperto(esistente: Pagamento, riga: RigaSiscom): Pagamento {
  const blocchetti = calcolaBlocchetti(riga.importoCentesimi)
  return {
    ...riga,
    dataPagamento: riga.dataPagamento ?? esistente.dataPagamento,
    annoScolastico: etichettaImportabile(riga) ?? esistente.annoScolastico,
    tariffaRidotta: blocchetti.tariffaRidotta,
    blocchettiDovuti: blocchetti.dovuti,
    blocchettiConsegnati: esistente.blocchettiConsegnati,
  }
}

function compilaCampiVuoti(esistente: Pagamento, riga: RigaSiscom): Pagamento {
  return {
    ...esistente,
    annoScolastico: riempiTesto(esistente.annoScolastico, etichettaImportabile(riga) ?? ""),
    reversaleData: riempi(esistente.reversaleData, riga.reversaleData),
    reversaleNumero: riempiTesto(esistente.reversaleNumero, riga.reversaleNumero),
    pspRiferimento: riempiTesto(esistente.pspRiferimento, riga.pspRiferimento),
    dataScadenza: riempi(esistente.dataScadenza, riga.dataScadenza),
  }
}

function riempi(attuale: string | null, nuovo: string | null): string | null {
  if (attuale != null && attuale.trim() !== "") return attuale
  if (nuovo == null || nuovo.trim() === "") return attuale
  return nuovo
}

function riempiTesto(attuale: string, nuovo: string): string {
  if (attuale.trim() !== "") return attuale
  if (nuovo.trim() === "") return attuale
  return nuovo
}

function uguale(a: Pagamento, b: Pagamento): boolean {
  return (
    a.iuv === b.iuv &&
    a.dataScadenza === b.dataScadenza &&
    a.dataPagamento === b.dataPagamento &&
    a.servizio === b.servizio &&
    a.tipologia === b.tipologia &&
    a.importoCentesimi === b.importoCentesimi &&
    a.debitore === b.debitore &&
    a.accertamentoAnno === b.accertamentoAnno &&
    a.accertamentoNumero === b.accertamentoNumero &&
    a.reversaleData === b.reversaleData &&
    a.reversaleNumero === b.reversaleNumero &&
    a.dataEmissione === b.dataEmissione &&
    a.pspRiferimento === b.pspRiferimento &&
    a.causale === b.causale &&
    a.cognome === b.cognome &&
    a.nome === b.nome &&
    a.codiceFiscale === b.codiceFiscale &&
    a.annoScolastico === b.annoScolastico &&
    a.tariffaRidotta === b.tariffaRidotta &&
    a.blocchettiDovuti === b.blocchettiDovuti &&
    a.blocchettiConsegnati === b.blocchettiConsegnati
  )
}
