"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

// Barra comune della suite (docs/BARRA-COMUNE.md di suite-comune): markup e classi `sc-`
// vanno tenuti identici agli altri moduli. Senza `utente` mostra solo il marchio
// (pagine pubbliche: accesso, privacy).

const VOCI = [{ etichetta: "Registro consegne", href: "/" }]

function attiva(percorso: string, href: string): boolean {
  return href === "/" ? percorso === "/" : percorso === href || percorso.startsWith(`${href}/`)
}

type Utente = { nome: string; solaLettura: boolean }

export function BarraComune({ utente, suiteUrl }: { utente?: Utente; suiteUrl?: string }) {
  const percorso = usePathname() ?? "/"
  const stato = useRef<HTMLInputElement>(null)

  // Il menu su telefono si richiude quando cambia pagina.
  useEffect(() => {
    if (stato.current) stato.current.checked = false
  }, [percorso])

  return (
    <header className="sc-barra">
      <div className="sc-barra-dentro">
        <Link className="sc-marchio" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element -- markup identico agli altri moduli */}
          <img src="/logo-comune.png" alt="" width={40} height={40} />
          <span>
            <span className="sc-ente">Comune di San Lorenzo del Vallo</span>
            <span className="sc-modulo">Buoni mensa</span>
          </span>
        </Link>
        {utente ? (
          <>
            <input type="checkbox" id="sc-menu-stato" className="sc-menu-stato" ref={stato} />
            <label htmlFor="sc-menu-stato" className="sc-menu-apri">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Menu
            </label>
            <div className="sc-menu-corpo">
              <nav className="sc-voci" aria-label="Menu del modulo">
                {VOCI.map((voce) => (
                  <Link
                    key={voce.href}
                    className="sc-voce"
                    href={voce.href}
                    aria-current={attiva(percorso, voce.href) ? "page" : undefined}
                  >
                    {voce.etichetta}
                  </Link>
                ))}
              </nav>
              <div className="sc-utente">
                <span className="sc-nome">
                  {utente.nome}
                  {utente.solaLettura ? <> <small>· sola lettura</small></> : null}
                </span>
                {suiteUrl ? (
                  <a className="sc-pulsante" href={suiteUrl}>
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                      <path
                        d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    Suite
                  </a>
                ) : null}
                <form method="post" action="/api/accesso">
                  <button className="sc-pulsante sc-esci" type="submit">
                    Esci
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </header>
  )
}
