export const CENTESIMI_BLOCCHETTO = 4000

export function eImportoBlocchetto(centesimi: number): boolean {
  return centesimi > 0 && centesimi % CENTESIMI_BLOCCHETTO === 0
}

export function numeroBlocchetti(centesimi: number): number {
  if (!eImportoBlocchetto(centesimi)) return 0
  return centesimi / CENTESIMI_BLOCCHETTO
}
