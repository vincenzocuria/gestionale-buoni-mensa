// L'export Siscom «StampaRicerca» contiene tutti i pagamenti PagoPA del Comune
// (acquedotto, carta d'identità, trasporto, terreni...): nel registro entrano
// solo quelli del servizio mensa («MENSE SCOLASTICHE»).
//
// Alcuni cittadini pagano un altro servizio (per esempio «DIRITTI VARI» da
// 40 €) e scrivono «mensa» nella causale: il pagamento non è agganciato al
// servizio mensa, quindi non entra nel registro ma va segnalato all'ufficio.
export type ClasseRiga = "mensa" | "mensa_su_altro_servizio" | "altro_servizio"

const MENSA = /\bmens[ae]\b/i

export function classificaRiga(riga: { servizio: string; causale: string }): ClasseRiga {
  if (MENSA.test(riga.servizio)) return "mensa"
  // Export senza la colonna «Servizio»: resta solo la causale.
  if (riga.servizio.trim() === "") return MENSA.test(riga.causale) ? "mensa" : "altro_servizio"
  if (MENSA.test(riga.causale)) return "mensa_su_altro_servizio"
  return "altro_servizio"
}
