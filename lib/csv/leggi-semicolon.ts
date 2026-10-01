export function leggiCsvSemicolon(testo: string): string[][] {
  const src = testo.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const righe: string[][] = []
  let riga: string[] = []
  let cella = ""
  let traVirgolette = false

  for (let i = 0; i < src.length; i++) {
    const carattere = src[i]
    if (traVirgolette) {
      if (carattere === '"') {
        if (src[i + 1] === '"') {
          cella += '"'
          i++
        } else {
          traVirgolette = false
        }
      } else {
        cella += carattere
      }
      continue
    }
    if (carattere === '"') {
      traVirgolette = true
      continue
    }
    if (carattere === ";") {
      riga.push(cella)
      cella = ""
      continue
    }
    if (carattere === "\n") {
      riga.push(cella)
      if (riga.some((campo) => campo.trim() !== "")) righe.push(riga)
      riga = []
      cella = ""
      continue
    }
    cella += carattere
  }

  if (cella.length > 0 || riga.length > 0) {
    riga.push(cella)
    if (riga.some((campo) => campo.trim() !== "")) righe.push(riga)
  }

  return righe
}
