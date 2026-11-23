// L'export Siscom «StampaRicerca» contiene tutti i pagamenti PagoPA del Comune
// (acquedotto, carta d'identità, trasporto, terreni...): nel registro entrano
// solo quelli della mensa. Il servizio è «MENSE SCOLASTICHE»; alcuni bollettini
// mensa sono però stati emessi come «DIRITTI VARI» con la causale «Mensa
// scolastica ...» o «Buoni mensa ...», e si riconoscono dalla causale.
export function eRigaMensa(riga: { servizio: string; causale: string }): boolean {
  if (/\bmens[ae]\b/i.test(riga.servizio)) return true
  return /\bmens[ae]\b/i.test(riga.causale)
}
