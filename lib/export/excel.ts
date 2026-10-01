import type { Foglio } from "@/lib/export/tabelle"

export function creaExcel(fogli: Foglio[]): string {
  const corpi = fogli.map((foglio) => foglioXml(foglio)).join("")
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${corpi}</Workbook>`
}

function foglioXml(foglio: Foglio): string {
  const righe = [foglio.intestazioni, ...foglio.righe]
    .map((riga) => `<Row>${riga.map((cella) => `<Cell><Data ss:Type="String">${xml(cella)}</Data></Cell>`).join("")}</Row>`)
    .join("")
  return `<Worksheet ss:Name="${xml(foglio.nome)}"><Table>${righe}</Table></Worksheet>`
}

function xml(valore: string): string {
  return valore
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}
