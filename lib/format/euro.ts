const euro = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
})

export function formatEuro(centesimi: number): string {
  return euro.format(centesimi / 100)
}
