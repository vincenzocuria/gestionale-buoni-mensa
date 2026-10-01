export function eRigaTest(importoCentesimi: number, causale: string): boolean {
  return importoCentesimi === 1 || causale.toLowerCase().includes("test")
}
