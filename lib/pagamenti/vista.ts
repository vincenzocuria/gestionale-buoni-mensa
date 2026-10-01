import { statoPagamento } from "@/lib/pagamenti/stato"
import type { Pagamento, RigaElenco } from "@/lib/pagamenti/tipi"

export function aVista(pagamento: Pagamento): RigaElenco {
  return {
    iuv: pagamento.iuv,
    debitore: pagamento.debitore,
    cognome: pagamento.cognome,
    nome: pagamento.nome,
    codiceFiscale: pagamento.codiceFiscale,
    importoCentesimi: pagamento.importoCentesimi,
    tariffaRidotta: pagamento.tariffaRidotta,
    blocchettiDovuti: pagamento.blocchettiDovuti,
    blocchettiConsegnati: pagamento.blocchettiConsegnati,
    dataPagamento: pagamento.dataPagamento,
    dataScadenza: pagamento.dataScadenza,
    annoScolastico: pagamento.annoScolastico,
    stato: statoPagamento(pagamento),
  }
}
