"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { esci } from "@/app/accesso/azioni"
import { AzioniConsegna } from "@/components/azioni-consegna"
import { AzioniConsegnaGruppo } from "@/components/azioni-consegna-gruppo"
import { BarraStrumenti } from "@/components/barra-strumenti"
import { ElencoPagamenti } from "@/components/elenco-pagamenti"
import { FiltroPeriodo } from "@/components/filtro-periodo"
import { MarchioComune } from "@/components/marchio-comune"
import { ModaleGruppo } from "@/components/modale-gruppo"
import { RiepilogoImport } from "@/components/riepilogo-import"
import { SelettoreAnno } from "@/components/selettore-anno"
import { StrisciaKpi } from "@/components/striscia-kpi"
import { Button } from "@/components/ui/button"
import { analizzaBlocchetti } from "@/lib/audit/gruppi"
import { annoPredefinito, anniSelezionabili, righeDellAnno } from "@/lib/anno-scolastico/calcola"
import { calcolaKpi } from "@/lib/pagamenti/kpi"
import { filtraPeriodo, oggiLocale, PERIODO_VUOTO, type Periodo } from "@/lib/pagamenti/periodo"
import { alternaOrdine, ordinaVoci, type OrdineElenco } from "@/lib/pagamenti/ordina"
import { slicePagina } from "@/lib/pagamenti/pagina"
import { compattaElenco, contaFiltri, filtraVoci } from "@/lib/pagamenti/voci"
import type { FiltroElenco, Kpi, RigaElenco, RiepilogoImport as Riepilogo } from "@/lib/pagamenti/tipi"

type Carico = {
  righe: RigaElenco[]
  kpi: Kpi
}

export function RegistroMensa() {
  const [carico, setCarico] = useState<Carico | null>(null)
  const [caricamento, setCaricamento] = useState(true)
  const [errore, setErrore] = useState<string | null>(null)
  const [tentativo, setTentativo] = useState(0)
  const [anno, setAnno] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<FiltroElenco>("tutti")
  const [periodo, setPeriodo] = useState<Periodo>(PERIODO_VUOTO)
  const [oggi] = useState(oggiLocale)
  const [ricerca, setRicerca] = useState("")
  const [pagina, setPagina] = useState(1)
  const [ordine, setOrdine] = useState<OrdineElenco | null>(null)
  const [pendingGruppo, setPendingGruppo] = useState<string | null>(null)
  const [gruppoAperto, setGruppoAperto] = useState<string | null>(null)
  const [riepilogo, setRiepilogo] = useState<Riepilogo | null>(null)
  const [erroreImport, setErroreImport] = useState<string | null>(null)
  const [importando, setImportando] = useState(false)
  const [pendingIuv, setPendingIuv] = useState<string | null>(null)
  const [erroreAzione, setErroreAzione] = useState<string | null>(null)
  const router = useRouter()

  const leggi = useCallback(async () => {
    const risposta = await fetch("/api/pagamenti", { cache: "no-store" })
    if (risposta.status === 401) {
      router.push("/accesso")
      return null
    }
    const corpo = await risposta.json().catch(() => null)
    if (!risposta.ok) throw new Error(corpo?.errore ?? "Non riesco a leggere il registro.")
    return corpo as Carico
  }, [router])

  useEffect(() => {
    let attivo = true
    leggi()
      .then((corpo) => {
        if (attivo && corpo) setCarico(corpo)
      })
      .catch((err: unknown) => {
        if (!attivo) return
        setErrore(err instanceof Error ? err.message : "Non riesco a leggere il registro.")
      })
      .finally(() => {
        if (attivo) setCaricamento(false)
      })
    return () => {
      attivo = false
    }
  }, [leggi, tentativo])

  const anni = useMemo(() => anniSelezionabili(carico?.righe.map((riga) => riga.annoScolastico) ?? []), [carico])
  const annoAttivo = anno && anni.includes(anno) ? anno : annoPredefinito(anni)
  const delAnno = useMemo(() => (carico ? righeDellAnno(carico.righe, annoAttivo) : []), [carico, annoAttivo])
  const kpi = useMemo(() => calcolaKpi(delAnno), [delAnno])
  const analisi = useMemo(() => analizzaBlocchetti(delAnno), [delAnno])
  const voci = useMemo(() => compattaElenco(delAnno, analisi), [delAnno, analisi])
  const nelPeriodo = useMemo(() => filtraPeriodo(voci, periodo), [voci, periodo])
  const visibili = useMemo(() => filtraVoci(nelPeriodo, filtro, ricerca), [nelPeriodo, filtro, ricerca])
  const ordinate = useMemo(() => ordinaVoci(visibili, ordine), [visibili, ordine])
  const conteggi = useMemo(() => contaFiltri(nelPeriodo, ricerca), [nelPeriodo, ricerca])
  const paginati = useMemo(() => slicePagina(ordinate, pagina), [ordinate, pagina])
  const dettaglio = analisi.gruppi.find((gruppo) => gruppo.id === gruppoAperto) ?? null
  const righeDettaglio = dettaglio
    ? dettaglio.pagamenti
        .map((pagamento) => delAnno.find((riga) => riga.iuv === pagamento.iuv))
        .filter((riga): riga is RigaElenco => riga != null)
    : []

  async function importa(file: File) {
    setImportando(true)
    setErroreImport(null)
    const body = new FormData()
    body.set("file", file)
    try {
      const risposta = await fetch("/api/import", { method: "POST", body })
      const corpo = await risposta.json().catch(() => null)
      if (!risposta.ok) {
        setErroreImport(corpo?.errore ?? "Import non riuscito.")
        return
      }
      setRiepilogo(corpo)
      const fresco = await leggi()
      if (fresco) setCarico(fresco)
    } catch {
      setErroreImport("Import non riuscito.")
    } finally {
      setImportando(false)
    }
  }

  async function consegna(iuv: string, azione: "completa" | "parziale" | "annulla") {
    setPendingIuv(iuv)
    setErroreAzione(null)
    try {
      const risposta = await fetch(`/api/pagamenti/${encodeURIComponent(iuv)}/consegna`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ azione }),
      })
      const corpo = await risposta.json().catch(() => null)
      if (!risposta.ok) {
        setErroreAzione(corpo?.errore ?? "Consegna non riuscita.")
        return
      }
      setCarico((attuale) =>
        attuale
          ? { ...attuale, righe: attuale.righe.map((riga) => (riga.iuv === iuv ? corpo.riga : riga)) }
          : attuale,
      )
      const fresco = await leggi()
      if (fresco) setCarico(fresco)
    } catch {
      setErroreAzione("Consegna non riuscita.")
    } finally {
      setPendingIuv(null)
    }
  }

  async function consegnaGruppo(id: string, azione: "completa" | "parziale" | "annulla") {
    setPendingGruppo(id)
    setErroreAzione(null)
    try {
      const risposta = await fetch("/api/audit/consegna", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, azione }),
      })
      const corpo = await risposta.json().catch(() => null)
      if (!risposta.ok) {
        setErroreAzione(corpo?.errore ?? "Consegna non riuscita.")
        return
      }
      const fresco = await leggi()
      if (fresco) setCarico(fresco)
    } catch {
      setErroreAzione("Consegna non riuscita.")
    } finally {
      setPendingGruppo(null)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <MarchioComune>
          <h1 className="mt-1 font-serif text-4xl tracking-tight">Buoni mensa</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Consegne dei blocchetti. Un nuovo export Siscom aggiorna solo i bollettini ancora aperti.
          </p>
        </MarchioComune>
        <form action={esci}>
          <Button type="submit" variant="outline">
            Esci
          </Button>
        </form>
      </header>

      <div className="mt-6 flex flex-col gap-4">
        {carico ? (
          <SelettoreAnno
            anni={anni}
            attivo={annoAttivo}
            onCambio={(scelto) => {
              setAnno(scelto)
              setPeriodo(PERIODO_VUOTO)
              setPagina(1)
            }}
          />
        ) : null}
        {carico ? <StrisciaKpi kpi={kpi} /> : null}
        <BarraStrumenti
          filtro={filtro}
          ricerca={ricerca}
          conteggi={conteggi}
          importando={importando}
          anno={annoAttivo}
          periodo={periodo}
          onFiltro={(scelto) => {
            setFiltro(scelto)
            setPagina(1)
          }}
          onRicerca={(valore) => {
            setRicerca(valore)
            setPagina(1)
          }}
          onFile={importa}
        />
        <FiltroPeriodo
          periodo={periodo}
          oggi={oggi}
          onCambio={(scelto) => {
            setPeriodo(scelto)
            setPagina(1)
          }}
        />
        {riepilogo ? <RiepilogoImport riepilogo={riepilogo} /> : null}
        {erroreImport ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {erroreImport}
          </p>
        ) : null}
        {erroreAzione ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
            {erroreAzione}
          </p>
        ) : null}
        <ElencoPagamenti
          voci={paginati.voci}
          totale={delAnno.length}
          filtrati={visibili.length}
          pagina={paginati.pagina}
          pagine={paginati.pagine}
          dal={paginati.dal}
          al={paginati.al}
          onPagina={setPagina}
          filtro={filtro}
          ricerca={ricerca}
          caricamento={caricamento}
          errore={errore}
          pendingIuv={pendingIuv}
          onRiprova={() => {
            setErrore(null)
            setCaricamento(true)
            setTentativo((n) => n + 1)
          }}
          onApriGruppo={setGruppoAperto}
          azioniGruppo={(gruppo) => (
            <AzioniConsegnaGruppo
              gruppo={gruppo}
              pending={pendingGruppo === gruppo.id}
              onConsegna={(azione) => consegnaGruppo(gruppo.id, azione)}
            />
          )}
          azioni={(riga) => (
            <AzioniConsegna
              riga={riga}
              pending={pendingIuv === riga.iuv}
              onAzione={(azione) => consegna(riga.iuv, azione)}
            />
          )}
          ordine={ordine}
          onOrdina={(colonna) => {
            setOrdine((attuale) => alternaOrdine(attuale, colonna))
            setPagina(1)
          }}
        />
        {dettaglio ? (
          <ModaleGruppo
            gruppo={dettaglio}
            righe={righeDettaglio}
            pending={pendingGruppo === dettaglio.id}
            onChiudi={() => setGruppoAperto(null)}
            onConsegna={(azione) => consegnaGruppo(dettaglio.id, azione)}
          />
        ) : null}
      </div>
    </div>
  )
}
