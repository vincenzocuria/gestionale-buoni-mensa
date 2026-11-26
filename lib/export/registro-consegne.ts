import { analizzaBlocchetti } from "@/lib/audit/gruppi"
import { formatEuro } from "@/lib/format/euro"
import { filtraPeriodo, PERIODO_VUOTO, type Periodo } from "@/lib/pagamenti/periodo"
import type { RigaElenco } from "@/lib/pagamenti/tipi"
import { compattaElenco, dataPiuRecente, filtraVoci, statoVoce, type VoceElenco } from "@/lib/pagamenti/voci"

/** Una riga del registro cartaceo: una famiglia (o un gruppo di bollettini accorpati). */
export type RigaRegistro = {
  debitore: string
  codiceFiscale: string
  importoCentesimi: number
  /** Blocchetti ancora da consegnare. */
  daConsegnare: number
  /** Blocchetti pagati in tutto (per «1 di 2» quando una parte è già stata consegnata). */
  totali: number
  dataPagamento: string | null
  iuv: string[]
  anomalia: boolean
  nota: string | null
}

export type OpzioniRegistro = {
  /** Aggiunge anche le anomalie (importi che non fanno blocchetti interi), già consegnate o no. */
  anomalie: boolean
  ricerca?: string
  periodo?: Periodo
}

export function righeRegistro(anno: RigaElenco[], opzioni: OpzioniRegistro): RigaRegistro[] {
  const analisi = analizzaBlocchetti(anno)
  const voci = filtraVoci(filtraPeriodo(compattaElenco(anno, analisi), opzioni.periodo ?? PERIODO_VUOTO), "tutti", opzioni.ricerca ?? "")
  return voci
    .filter((voce) => statoVoce(voce) === "da_consegnare" || (opzioni.anomalie && eAnomalia(voce)))
    .map(aRigaRegistro)
    // Un'anomalia senza blocchetti interi (es. 20 €) non ha niente da consegnare: entra solo se si chiedono le anomalie.
    .filter((riga) => riga.daConsegnare > 0 || (opzioni.anomalie && riga.anomalia))
    .sort((a, b) => a.debitore.localeCompare(b.debitore, "it") || (a.dataPagamento ?? "").localeCompare(b.dataPagamento ?? ""))
}

export function totaliRegistro(righe: RigaRegistro[]): { famiglie: number; blocchetti: number; importoCentesimi: number } {
  return {
    famiglie: righe.length,
    blocchetti: righe.reduce((somma, riga) => somma + riga.daConsegnare, 0),
    importoCentesimi: righe.reduce((somma, riga) => somma + riga.importoCentesimi, 0),
  }
}

function eAnomalia(voce: VoceElenco): boolean {
  return voce.tipo === "gruppo" && voce.gruppo.esito === "anomalia"
}

function aRigaRegistro(voce: VoceElenco): RigaRegistro {
  if (voce.tipo === "singola") {
    const riga = voce.riga
    return {
      debitore: riga.debitore,
      codiceFiscale: riga.codiceFiscale,
      importoCentesimi: riga.importoCentesimi,
      daConsegnare: Math.max(0, riga.blocchettiDovuti - riga.blocchettiConsegnati),
      totali: riga.blocchettiDovuti,
      dataPagamento: riga.dataPagamento,
      iuv: [riga.iuv],
      anomalia: false,
      nota: null,
    }
  }
  const { gruppo, righe } = voce
  const pagate = righe.filter((riga) => riga.dataPagamento)
  const anomalia = gruppo.esito === "anomalia"
  return {
    debitore: gruppo.debitore,
    codiceFiscale: righe[0]?.codiceFiscale ?? "",
    importoCentesimi: gruppo.sommaCentesimi,
    daConsegnare: Math.max(0, gruppo.blocchetti - gruppo.consegnati),
    totali: gruppo.blocchetti,
    dataPagamento: dataPiuRecente(righe.map((riga) => riga.dataPagamento)),
    iuv: (pagate.length > 0 ? pagate : righe).map((riga) => riga.iuv),
    anomalia,
    nota: anomalia
      ? `Anomalia: ${formatEuro(gruppo.residuoCentesimi)} da chiarire`
      : `${righe.length} bollettini accorpati`,
  }
}
