import { createHash, timingSafeEqual } from "node:crypto"

export const NOME_COOKIE = "mensa_sessione"

export function passwordConfigurata(): boolean {
  return Boolean(process.env.UFFICIO_PASSWORD)
}

export function passwordCorretta(inserita: string): boolean {
  const attesa = process.env.UFFICIO_PASSWORD
  if (!attesa) return false
  return timingSafeEqual(impronta(inserita), impronta(attesa))
}

export function tokenSessione(): string | null {
  const password = process.env.UFFICIO_PASSWORD
  if (!password) return null
  return createHash("sha256").update(`mensa-ufficio:${password}`).digest("hex")
}

export function sessioneValida(valore: string | undefined | null): boolean {
  const atteso = tokenSessione()
  if (!atteso || !valore) return false
  return timingSafeEqual(impronta(valore), impronta(atteso))
}

export function opzioniCookie(): {
  httpOnly: true
  sameSite: "lax"
  secure: boolean
  path: string
  maxAge: number
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  }
}

function impronta(valore: string): Buffer {
  return createHash("sha256").update(valore).digest()
}
