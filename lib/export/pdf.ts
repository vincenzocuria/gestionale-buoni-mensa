import type { Foglio } from "@/lib/export/tabelle"

const LARGHEZZA = 595
const ALTEZZA = 842
const MARGINE = 36
const RIGA = 12

export function creaPdf(titolo: string, fogli: Foglio[]): Uint8Array {
  const pagine = impagina(titolo, fogli)
  return documento(pagine)
}

function impagina(titolo: string, fogli: Foglio[]): string[] {
  const pagine: string[] = []
  let comandi: string[] = []
  let y = ALTEZZA - MARGINE

  function nuova() {
    if (comandi.length > 0) pagine.push(comandi.join("\n"))
    comandi = []
    y = ALTEZZA - MARGINE
  }

  function testo(x: number, valore: string, dimensione = 9) {
    comandi.push(`BT /F1 ${dimensione} Tf ${x} ${y} Td (${pdf(valore)}) Tj ET`)
  }

  function riga(celle: string[], colonne: number[]) {
    if (y < MARGINE + RIGA) nuova()
    let x = MARGINE
    celle.forEach((cella, indice) => {
      testo(x, accorcia(cella, colonne[indice] ?? 80))
      x += colonne[indice] ?? 80
    })
    y -= RIGA
  }

  testo(MARGINE, titolo, 14)
  y -= 22

  for (const foglio of fogli) {
    if (y < MARGINE + RIGA * 4) nuova()
    testo(MARGINE, foglio.nome, 12)
    y -= 16
    const colonne = larghezze(foglio.intestazioni.length)
    riga(foglio.intestazioni, colonne)
    y -= 2
    if (foglio.righe.length === 0) {
      riga(["Nessuna riga"], colonne)
      continue
    }
    for (const voce of foglio.righe) riga(voce, colonne)
    y -= 10
  }

  if (comandi.length > 0) pagine.push(comandi.join("\n"))
  return pagine.length > 0 ? pagine : ["BT /F1 12 Tf 36 800 Td (Vuoto) Tj ET"]
}

function larghezze(n: number): number[] {
  const utile = LARGHEZZA - MARGINE * 2
  const base = Math.floor(utile / Math.max(1, n))
  return Array.from({ length: n }, () => base)
}

function accorcia(valore: string, larghezza: number): string {
  const massimo = Math.max(4, Math.floor(larghezza / 4.6))
  if (valore.length <= massimo) return valore
  return `${valore.slice(0, massimo - 1)}…`
}

function pdf(valore: string): string {
  let out = ""
  for (const carattere of valore) {
    const codice = carattere.codePointAt(0) ?? 63
    if (carattere === "\\" || carattere === "(" || carattere === ")") {
      out += `\\${carattere}`
      continue
    }
    if (codice >= 32 && codice <= 126) {
      out += carattere
      continue
    }
    const byte = byteWinAnsi(codice)
    out += `\\${byte.toString(8).padStart(3, "0")}`
  }
  return out
}

function byteWinAnsi(codice: number): number {
  if (codice >= 32 && codice <= 255) return codice
  if (codice === 0x20ac) return 0x80
  if (codice === 0x2026) return 0x85
  return 0x3f
}

function documento(pagine: string[]): Uint8Array {
  const oggetti: string[] = []
  const kids: string[] = []
  let id = 3
  for (const contenuto of pagine) {
    const paginaId = id
    const flussoId = id + 1
    kids.push(`${paginaId} 0 R`)
    oggetti.push(
      `${paginaId} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${LARGHEZZA} ${ALTEZZA}] /Contents ${flussoId} 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >> >> >> >> endobj`,
    )
    const flusso = contenuto
    oggetti.push(`${flussoId} 0 obj << /Length ${Buffer.byteLength(flusso)} >> stream\n${flusso}\nendstream endobj`)
    id += 2
  }
  const catalogo = `1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj`
  const pagineObj = `2 0 obj << /Type /Pages /Count ${pagine.length} /Kids [${kids.join(" ")}] >> endobj`
  const corpo = [catalogo, pagineObj, ...oggetti]
  let pdfTesto = "%PDF-1.4\n"
  const offset: number[] = [0]
  for (const oggetto of corpo) {
    offset.push(Buffer.byteLength(pdfTesto))
    pdfTesto += `${oggetto}\n`
  }
  const inizioXref = Buffer.byteLength(pdfTesto)
  pdfTesto += `xref\n0 ${corpo.length + 1}\n`
  pdfTesto += "0000000000 65535 f \n"
  for (let i = 1; i < offset.length; i++) {
    pdfTesto += `${String(offset[i]).padStart(10, "0")} 00000 n \n`
  }
  pdfTesto += `trailer << /Size ${corpo.length + 1} /Root 1 0 R >>\nstartxref\n${inizioXref}\n%%EOF`
  return Buffer.from(pdfTesto)
}
