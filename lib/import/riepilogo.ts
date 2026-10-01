import type { EsitoMerge, RiepilogoImport } from "@/lib/pagamenti/tipi"

export function riepilogoVuoto(): RiepilogoImport {
  return {
    nuovi: 0,
    aggiornati: 0,
    ignorati: 0,
    invariati: 0,
    esclusiTest: 0,
    fuoriPeriodo: 0,
    righeLette: 0,
    errori: [],
  }
}

export function contaEsito(riepilogo: RiepilogoImport, esito: EsitoMerge): void {
  if (esito === "nuovo") riepilogo.nuovi += 1
  else if (esito === "aggiornato") riepilogo.aggiornati += 1
  else if (esito === "ignorato") riepilogo.ignorati += 1
  else if (esito === "invariato") riepilogo.invariati += 1
  else riepilogo.esclusiTest += 1
}
