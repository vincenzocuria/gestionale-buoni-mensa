import { deflateSync } from "node:zlib"
import { formatDataIt } from "@/lib/format/data-it"
import { formatEuro } from "@/lib/format/euro"
import { HELVETICA, HELVETICA_BOLD, HELVETICA_OBLIQUE } from "@/lib/export/metriche-font"
import { byteWinAnsi, testoPdf } from "@/lib/export/pdf"
import { totaliRegistro, type RigaRegistro } from "@/lib/export/registro-consegne"
import { STEMMA } from "@/lib/export/stemma"

// A4 orizzontale: le colonne per firma e data di ritiro devono essere larghe abbastanza da scriverci a mano.
const LARGHEZZA = 842
const ALTEZZA = 595
const MARGINE = 30

// Intestazione e piè di pagina della carta intestata del Comune.
const COMUNE = "COMUNE DI SAN LORENZO DEL VALLO"
const PROVINCIA = "(PROVINCIA DI COSENZA)"
const PIE = [
  "Viale della Libertà 123 - 87040 San Lorenzo del Vallo (CS) · C.F./P.IVA: 01334140785",
  "Telefono: 0981 953103 · e-mail: comune@sanlorenzodelvallo.eu · PEC: sanlorenzodelvallo@asmepec.it · Codice Univoco: UFCXE1",
]

type Font = "F1" | "F2" | "F3"
const METRICHE: Record<Font, readonly number[]> = { F1: HELVETICA, F2: HELVETICA_BOLD, F3: HELVETICA_OBLIQUE }

type Colonna = { titolo: string; larghezza: number; allinea?: "destra" | "centro" }

const COLONNE: Colonna[] = [
  { titolo: "N.", larghezza: 24, allinea: "centro" },
  { titolo: "Debitore", larghezza: 178 },
  { titolo: "Importo", larghezza: 56, allinea: "destra" },
  { titolo: "Blocchetti", larghezza: 52, allinea: "centro" },
  { titolo: "Pagato il", larghezza: 60, allinea: "centro" },
  { titolo: "IUV", larghezza: 108 },
  { titolo: "Data ritiro", larghezza: 72 },
  { titolo: "Firma di chi ritira", larghezza: LARGHEZZA - MARGINE * 2 - (24 + 178 + 56 + 52 + 60 + 108 + 72) },
]

const ALTEZZA_TESTATA_TABELLA = 18
const RIGA_MINIMA = 30
const INTERLINEA = 9.5
const PAD = 5
const FONDO_TABELLA = 62

export type IntestazioneRegistro = {
  annoScolastico: string
  /** Es. «Solo blocchetti da consegnare» o «Da consegnare e anomalie». */
  contenuto: string
  /** Filtri di ricerca/periodo applicati, se ci sono. */
  filtri: string | null
  stampatoIl: Date
}

export function creaPdfRegistro(righe: RigaRegistro[], intestazione: IntestazioneRegistro): Uint8Array {
  return documento(impagina(righe, intestazione))
}

function impagina(righe: RigaRegistro[], intestazione: IntestazioneRegistro): string[] {
  const pagine: string[][] = []
  let comandi: string[] = []
  let y = 0

  function nuovaPagina(conTabella = true) {
    comandi = []
    pagine.push(comandi)
    y = cartaIntestata(comandi, intestazione)
    if (conTabella) y = testataTabella(comandi, y)
  }

  nuovaPagina()

  if (righe.length === 0) {
    cella(comandi, MARGINE, y, LARGHEZZA - MARGINE * 2, RIGA_MINIMA)
    testo(comandi, "F3", 10, MARGINE + PAD, y - 19, "Nessun blocchetto da consegnare con questi criteri.")
    y -= RIGA_MINIMA
  }

  righe.forEach((riga, indice) => {
    const celle = contenutoRiga(riga, indice + 1)
    const linee = Math.max(...celle.map((voce) => voce.length))
    const altezza = Math.max(RIGA_MINIMA, linee * INTERLINEA + PAD * 2)
    if (y - altezza < FONDO_TABELLA) nuovaPagina()
    disegnaRiga(comandi, y, altezza, celle, riga.anomalia)
    y -= altezza
  })

  // Totali e firma dell'addetto in fondo all'ultima pagina.
  if (y - 58 < FONDO_TABELLA) nuovaPagina(false)
  const totali = totaliRegistro(righe)
  y -= 16
  testo(
    comandi,
    "F2",
    9,
    MARGINE,
    y,
    `Totale: ${totali.famiglie} ${totali.famiglie === 1 ? "riga" : "righe"} · ${totali.blocchetti} ${totali.blocchetti === 1 ? "blocchetto" : "blocchetti"} da consegnare · ${formatEuro(totali.importoCentesimi)}`,
  )
  y -= 30
  testo(comandi, "F1", 9, MARGINE, y, "L'addetto alla consegna")
  linea(comandi, MARGINE + 110, y - 2, MARGINE + 330, y - 2, 0.6)
  testo(comandi, "F1", 9, LARGHEZZA - MARGINE - 250, y, "Data")
  linea(comandi, LARGHEZZA - MARGINE - 225, y - 2, LARGHEZZA - MARGINE, y - 2, 0.6)

  const totale = pagine.length
  return pagine.map((pagina, indice) => {
    piePagina(pagina, indice + 1, totale, intestazione.stampatoIl)
    return pagina.join("\n")
  })
}

function cartaIntestata(comandi: string[], intestazione: IntestazioneRegistro): number {
  // Stemma centrato come nella carta intestata.
  const altezzaStemma = 50
  const larghezzaStemma = (STEMMA.larghezza / STEMMA.altezza) * altezzaStemma
  const top = ALTEZZA - 18
  comandi.push(
    `q ${num(larghezzaStemma)} 0 0 ${altezzaStemma} ${num((LARGHEZZA - larghezzaStemma) / 2)} ${num(top - altezzaStemma)} cm /Im1 Do Q`,
  )
  let y = top - altezzaStemma - 13
  centrato(comandi, "F2", 12, y, COMUNE)
  y -= 11
  centrato(comandi, "F2", 8.5, y, PROVINCIA)
  y -= 10
  linea(comandi, MARGINE, y, LARGHEZZA - MARGINE, y, 0.8)
  y -= 16
  testo(comandi, "F2", 12, MARGINE, y, `Registro consegne blocchetti mensa · a.s. ${intestazione.annoScolastico}`)
  destra(comandi, "F1", 9, LARGHEZZA - MARGINE, y, intestazione.contenuto)
  y -= 12
  const sotto = intestazione.filtri
    ? `Filtri: ${intestazione.filtri}`
    : "Consegna a mano: chi ritira scrive la data e firma accanto al proprio nome."
  testo(comandi, "F3", 8.5, MARGINE, y, accorcia(sotto, "F3", 8.5, LARGHEZZA - MARGINE * 2))
  return y - 8
}

function testataTabella(comandi: string[], y: number): number {
  comandi.push(`0.9 g ${MARGINE} ${num(y - ALTEZZA_TESTATA_TABELLA)} ${LARGHEZZA - MARGINE * 2} ${ALTEZZA_TESTATA_TABELLA} re f 0 g`)
  let x = MARGINE
  for (const colonna of COLONNE) {
    cella(comandi, x, y, colonna.larghezza, ALTEZZA_TESTATA_TABELLA)
    allineato(comandi, "F2", 8.5, x, colonna, y - 12, colonna.titolo)
    x += colonna.larghezza
  }
  return y - ALTEZZA_TESTATA_TABELLA
}

type Linea = { font: Font; dimensione: number; valore: string }

function contenutoRiga(riga: RigaRegistro, numero: number): Linea[][] {
  const normale = (valore: string): Linea => ({ font: "F1", dimensione: 8.5, valore })
  const debitore: Linea[] = [{ font: "F2", dimensione: 9, valore: riga.debitore }]
  if (riga.codiceFiscale) debitore.push({ font: "F1", dimensione: 7.5, valore: riga.codiceFiscale })
  if (riga.nota) debitore.push({ font: "F3", dimensione: 7.5, valore: riga.nota })
  const blocchetti =
    riga.totali > riga.daConsegnare && riga.totali > 0 ? `${riga.daConsegnare} di ${riga.totali}` : String(riga.daConsegnare)
  return [
    [normale(String(numero))],
    debitore,
    [normale(formatEuro(riga.importoCentesimi))],
    [{ font: "F2", dimensione: 10, valore: blocchetti }],
    [normale(riga.dataPagamento ? formatDataIt(riga.dataPagamento).slice(0, 10) : "—")],
    riga.iuv.map((iuv) => ({ font: "F1", dimensione: 8, valore: iuv })),
    [],
    [],
  ]
}

function disegnaRiga(comandi: string[], y: number, altezza: number, celle: Linea[][], anomalia: boolean) {
  if (anomalia) {
    comandi.push(`1 0.95 0.85 rg ${MARGINE} ${num(y - altezza)} ${LARGHEZZA - MARGINE * 2} ${num(altezza)} re f 0 g`)
  }
  let x = MARGINE
  COLONNE.forEach((colonna, indice) => {
    cella(comandi, x, y, colonna.larghezza, altezza)
    let base = y - PAD - 7.5
    for (const voce of celle[indice] ?? []) {
      allineato(comandi, voce.font, voce.dimensione, x, colonna, base, voce.valore)
      base -= INTERLINEA
    }
    x += colonna.larghezza
  })
}

function piePagina(comandi: string[], pagina: number, totale: number, stampatoIl: Date) {
  const y = 44
  testo(comandi, "F1", 7.5, MARGINE, y, `Stampato il ${formatDataIt(stampatoIl.toISOString())}`)
  destra(comandi, "F1", 7.5, LARGHEZZA - MARGINE, y, `Pagina ${pagina} di ${totale}`)
  linea(comandi, MARGINE, y - 6, LARGHEZZA - MARGINE, y - 6, 0.5)
  centrato(comandi, "F1", 7, y - 16, PIE[0])
  centrato(comandi, "F1", 7, y - 25, PIE[1])
}

function allineato(comandi: string[], font: Font, dimensione: number, x: number, colonna: Colonna, y: number, valore: string) {
  const spazio = colonna.larghezza - PAD * 2
  const corto = accorcia(valore, font, dimensione, spazio)
  const largo = larghezzaTesto(corto, font, dimensione)
  const sinistra =
    colonna.allinea === "destra"
      ? x + colonna.larghezza - PAD - largo
      : colonna.allinea === "centro"
        ? x + (colonna.larghezza - largo) / 2
        : x + PAD
  testo(comandi, font, dimensione, sinistra, y, corto)
}

function cella(comandi: string[], x: number, y: number, larghezza: number, altezza: number) {
  comandi.push(`0.5 w 0.45 G ${num(x)} ${num(y - altezza)} ${num(larghezza)} ${num(altezza)} re S 0 G`)
}

function linea(comandi: string[], x1: number, y1: number, x2: number, y2: number, spessore: number) {
  comandi.push(`${spessore} w ${num(x1)} ${num(y1)} m ${num(x2)} ${num(y2)} l S`)
}

function testo(comandi: string[], font: Font, dimensione: number, x: number, y: number, valore: string) {
  comandi.push(`BT /${font} ${dimensione} Tf ${num(x)} ${num(y)} Td (${testoPdf(valore)}) Tj ET`)
}

function centrato(comandi: string[], font: Font, dimensione: number, y: number, valore: string) {
  testo(comandi, font, dimensione, (LARGHEZZA - larghezzaTesto(valore, font, dimensione)) / 2, y, valore)
}

function destra(comandi: string[], font: Font, dimensione: number, x: number, y: number, valore: string) {
  testo(comandi, font, dimensione, x - larghezzaTesto(valore, font, dimensione), y, valore)
}

export function larghezzaTesto(valore: string, font: Font, dimensione: number): number {
  const metriche = METRICHE[font]
  let totale = 0
  for (const carattere of valore) {
    const byte = byteWinAnsi(carattere.codePointAt(0) ?? 63)
    totale += metriche[byte - 32] ?? 556
  }
  return (totale * dimensione) / 1000
}

function accorcia(valore: string, font: Font, dimensione: number, spazio: number): string {
  if (larghezzaTesto(valore, font, dimensione) <= spazio) return valore
  let corto = valore
  while (corto.length > 1 && larghezzaTesto(`${corto}…`, font, dimensione) > spazio) corto = corto.slice(0, -1)
  return `${corto.trimEnd()}…`
}

function num(valore: number): string {
  return Number(valore.toFixed(2)).toString()
}

function documento(pagine: string[]): Uint8Array {
  const immagine = Buffer.from(STEMMA.dati, "base64")
  const oggetti: Buffer[] = []
  const aggiungi = (corpo: Buffer | string) => {
    oggetti.push(typeof corpo === "string" ? Buffer.from(corpo, "latin1") : corpo)
    return oggetti.length
  }
  const flusso = (dizionario: string, dati: Buffer) =>
    Buffer.concat([
      Buffer.from(`<< ${dizionario} /Length ${dati.length} >>\nstream\n`, "latin1"),
      dati,
      Buffer.from("\nendstream", "latin1"),
    ])

  const catalogo = aggiungi("<< /Type /Catalog /Pages 2 0 R >>")
  const radice = aggiungi("") // segnaposto per /Pages, riempito dopo
  const f1 = aggiungi("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
  const f2 = aggiungi("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")
  const f3 = aggiungi("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>")
  const im1 = aggiungi(
    flusso(
      `/Type /XObject /Subtype /Image /Width ${STEMMA.larghezza} /Height ${STEMMA.altezza} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode`,
      immagine,
    ),
  )
  const risorse = `<< /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R /F3 ${f3} 0 R >> /XObject << /Im1 ${im1} 0 R >> >>`
  const kids: number[] = []
  for (const contenuto of pagine) {
    const contenutoId = aggiungi(flusso("/Filter /FlateDecode", deflateSync(Buffer.from(contenuto, "latin1"))))
    kids.push(
      aggiungi(
        `<< /Type /Page /Parent ${radice} 0 R /MediaBox [0 0 ${LARGHEZZA} ${ALTEZZA}] /Contents ${contenutoId} 0 R /Resources ${risorse} >>`,
      ),
    )
  }
  oggetti[radice - 1] = Buffer.from(
    `<< /Type /Pages /Count ${kids.length} /Kids [${kids.map((id) => `${id} 0 R`).join(" ")}] >>`,
    "latin1",
  )

  const parti: Buffer[] = [Buffer.from("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n", "latin1")]
  let lunghezza = parti[0].length
  const offset: number[] = []
  oggetti.forEach((corpo, indice) => {
    offset.push(lunghezza)
    const pezzo = Buffer.concat([Buffer.from(`${indice + 1} 0 obj\n`, "latin1"), corpo, Buffer.from("\nendobj\n", "latin1")])
    parti.push(pezzo)
    lunghezza += pezzo.length
  })
  let coda = `xref\n0 ${oggetti.length + 1}\n0000000000 65535 f \n`
  for (const valore of offset) coda += `${String(valore).padStart(10, "0")} 00000 n \n`
  coda += `trailer\n<< /Size ${oggetti.length + 1} /Root ${catalogo} 0 R >>\nstartxref\n${lunghezza}\n%%EOF\n`
  parti.push(Buffer.from(coda, "latin1"))
  return Buffer.concat(parti)
}
