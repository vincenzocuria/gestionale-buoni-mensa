import { numeroBlocchetti } from "@/lib/blocchetti/tariffa"

export function calcolaBlocchetti(importoCentesimi: number): {
  dovuti: number
  tariffaRidotta: boolean
} {
  return { dovuti: numeroBlocchetti(importoCentesimi), tariffaRidotta: false }
}
