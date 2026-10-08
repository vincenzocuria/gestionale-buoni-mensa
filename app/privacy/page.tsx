import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Informativa Privacy",
}

export default function PrivacyPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{"Informativa sul trattamento dei dati personali"}</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">{"Buoni mensa scolastica — ai sensi degli artt. 13 e 14 del Regolamento (UE) 2016/679 (GDPR)"}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <p className="mb-2">{"La presente informativa riguarda i trattamenti di dati personali svolti tramite l'applicazione "}<strong>{"Buoni mensa"}</strong>{" (mensa.vcuria.app), utilizzata dagli uffici del Comune di San Lorenzo del Vallo per verificare i pagamenti del servizio di mensa scolastica effettuati tramite pagoPA e registrare la consegna dei blocchetti di buoni pasto. È rivolta ai genitori, ai tutori o agli altri soggetti che effettuano i pagamenti, agli alunni che fruiscono del servizio e al personale autorizzato che utilizza l'applicazione."}</p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">{"1. Titolare del trattamento"}</h3>
              <p className="mb-2">{"Il Titolare del trattamento è il "}<strong>{"Comune di San Lorenzo del Vallo"}</strong>{", con sede in Viale della Libertà 123, 87040 San Lorenzo del Vallo (CS), codice fiscale e partita IVA 01334140785."}</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>{"Telefono: 0981.953103"}</li>
                <li>{"E-mail: "}<a href="mailto:comune@sanlorenzodelvallo.eu" className="underline">{"comune@sanlorenzodelvallo.eu"}</a></li>
                <li>{"PEC: "}<a href="mailto:sanlorenzodelvallo@asmepec.it" className="underline">{"sanlorenzodelvallo@asmepec.it"}</a></li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">{"2. Responsabile della Protezione dei Dati (RPD/DPO)"}</h3>
              <p className="mb-2">{"I dati di contatto del Responsabile della Protezione dei Dati (RPD/DPO), come pubblicati sul sito istituzionale del Comune, sono: "}<strong>{"Indo s.r.l.s."}</strong>{", sede legale in Via G. Mancini 156, Cosenza, e-mail "}<a href="mailto:dpo@indoconsulting.it" className="underline">{"dpo@indoconsulting.it"}</a>{". Il RPD può essere contattato anche tramite la PEC del Comune "}<a href="mailto:sanlorenzodelvallo@asmepec.it" className="underline">{"sanlorenzodelvallo@asmepec.it"}</a>{"."}</p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">{"3. Interessati, categorie di dati e loro origine"}</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>{"Dati identificativi del soggetto pagatore (debitore) e, ove presenti nella posizione di pagamento, dell'alunno che fruisce del servizio: cognome, nome, codice fiscale."}</li>
                <li>{"Dati di pagamento: codice IUV, importo, date di emissione, scadenza e pagamento, causale, servizio e tipologia, riferimento del prestatore di servizi di pagamento (PSP), estremi contabili di accertamento e reversale, indicazione dell'applicazione di una tariffa ridotta."}</li>
                <li>{"Dati sulla consegna dei buoni: anno scolastico, numero di blocchetti dovuti e consegnati, date delle consegne."}</li>
                <li>{"Per gli utenti dell'applicazione (personale autorizzato): dati di navigazione e indirizzo IP da cui provengono tentativi di accesso non riusciti."}</li>
              </ul>
              <p className="mb-2">{"L'applicazione non tratta dati relativi alla salute (ad esempio diete speciali o allergie) né coordinate bancarie."}</p>
              <p className="mb-2"><strong>{"Origine dei dati."}</strong>{" I dati non sono raccolti direttamente presso l'interessato: provengono dall'archivio delle posizioni di pagamento pagoPA del Comune, esportato dal software gestionale dell'Ente e importato nell'applicazione dagli uffici."}</p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">{"4. Finalità e base giuridica del trattamento"}</h3>
              <p className="mb-2">{"I dati sono trattati per:"}</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>{"verificare i pagamenti del servizio di mensa scolastica e consegnare agli aventi diritto i blocchetti di buoni pasto corrispondenti;"}</li>
                <li>{"tenere il registro delle consegne e svolgere la rendicontazione amministrativa e contabile del servizio;"}</li>
                <li>{"gestire l'accesso riservato all'applicazione e garantirne la sicurezza."}</li>
              </ul>
              <p className="mb-2">{"Basi giuridiche:"}</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>{"art. 6, par. 1, lett. e, GDPR: esecuzione di un compito di interesse pubblico connesso all'erogazione del servizio di refezione scolastica di competenza comunale (art. 2-ter del D.Lgs. 196/2003);"}</li>
                <li>{"art. 6, par. 1, lett. c, GDPR: adempimento degli obblighi contabili e di rendicontazione previsti dall'ordinamento degli enti locali (D.Lgs. 267/2000 e D.Lgs. 118/2011)."}</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">{"5. Natura del conferimento"}</h3>
              <p className="mb-2">{"Il trattamento è necessario per la gestione del servizio: i dati derivano dalle posizioni di pagamento già in possesso del Comune e il loro trattamento non si basa sul consenso. Senza tali dati non è possibile verificare il pagamento né consegnare i buoni."}</p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">{"6. Modalità del trattamento e misure di sicurezza"}</h3>
              <p className="mb-2">{"I dati sono trattati con strumenti informatici, esclusivamente da personale del Comune autorizzato e istruito (art. 29 GDPR e art. 2-quaterdecies del D.Lgs. 196/2003), nel rispetto dei principi di liceità, correttezza, trasparenza, minimizzazione, esattezza e limitazione della conservazione (art. 5 GDPR)."}</p>
              <p className="mb-2">{"Sono adottate misure tecniche e organizzative adeguate al rischio (art. 32 GDPR), tra cui: accesso all'applicazione riservato e protetto da password, connessioni cifrate (HTTPS), limitazione dei tentativi di accesso, intestazioni di sicurezza HTTP ed esclusione delle pagine dall'indicizzazione dei motori di ricerca."}</p>
              <p className="mb-2">{"Non sono effettuati processi decisionali automatizzati, compresa la profilazione, di cui all'art. 22 GDPR."}</p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">{"7. Destinatari dei dati"}</h3>
              <p className="mb-2">{"I dati sono trattati dal personale degli uffici comunali competenti (servizi scolastici e ragioneria) autorizzato all'utilizzo dell'applicazione."}</p>
              <p className="mb-2">{"Possono inoltre venire a conoscenza dei dati, nei limiti strettamente necessari alle rispettive attività, i seguenti soggetti esterni che forniscono servizi al Comune, designati, ove previsto, responsabili del trattamento ai sensi dell'art. 28 GDPR:"}</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>{"Vercel Inc."}</strong>{" (Stati Uniti): servizio di hosting ed esecuzione dell'applicazione;"}</li>
                <li><strong>{"Turso"}</strong>{": servizio di database gestito in cui sono archiviati i dati dell'applicazione;"}</li>
                <li>{"il fornitore incaricato dello sviluppo e della manutenzione dell'applicazione, per le sole attività di assistenza tecnica."}</li>
              </ul>
              <p className="mb-2">{"I dati possono essere comunicati ad autorità pubbliche e organi di controllo nei soli casi previsti dalla legge. I dati personali non sono diffusi, salvo quanto eventualmente indicato in questa informativa."}</p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">{"8. Trasferimento dei dati verso Paesi terzi"}</h3>
              <p className="mb-2">{"L'applicazione è ospitata sull'infrastruttura di Vercel Inc. e le richieste sono elaborate su server situati negli Stati Uniti. Il trasferimento dei dati verso gli Stati Uniti avviene sulla base della decisione di adeguatezza della Commissione europea del 10 luglio 2023 relativa all'EU-U.S. Data Privacy Framework, al quale Vercel Inc. aderisce, nonché delle clausole contrattuali standard approvate dalla Commissione europea (Decisione di esecuzione (UE) 2021/914) previste dall'accordo sul trattamento dei dati del fornitore (artt. 45 e 46 GDPR)."}</p>
              <p className="mb-2">{"Per gli altri fornitori indicati al punto precedente, eventuali trasferimenti di dati verso Paesi non appartenenti allo Spazio economico europeo avvengono soltanto in presenza delle garanzie previste dagli artt. 45 e 46 GDPR (decisione di adeguatezza o clausole contrattuali standard)."}</p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">{"9. Periodo di conservazione"}</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>{"Dati di pagamento e di consegna dei buoni: per la durata dell'anno scolastico di riferimento e, successivamente, per il periodo previsto per la conservazione della documentazione contabile dell'Ente (di norma dieci anni), al termine del quale sono cancellati."}</li>
                <li>{"Indirizzi IP dei tentativi di accesso non riusciti: per il tempo strettamente necessario a prevenire accessi abusivi; sono eliminati in seguito a un accesso riuscito dallo stesso indirizzo."}</li>
                <li>{"Cookie di sessione: 12 ore dall'accesso, oppure fino all'uscita dall'applicazione."}</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">{"10. Cookie"}</h3>
              <p className="mb-2">{"L'applicazione utilizza esclusivamente cookie tecnici, necessari al suo funzionamento e per i quali non è richiesto il consenso (art. 122 del D.Lgs. 196/2003 e Linee guida del Garante del 10 giugno 2021). Non sono utilizzati cookie di profilazione né cookie analitici o di terze parti."}</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>{"mensa_sessione"}</strong>{": cookie tecnico che identifica la sessione autenticata degli uffici; non è accessibile agli script della pagina (HttpOnly) e scade dopo 12 ore."}</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">{"11. Diritti dell'interessato"}</h3>
              <p className="mb-2">{"In qualità di interessato può esercitare in qualsiasi momento, nei limiti e alle condizioni previsti dalla normativa, i diritti di cui agli artt. 15-22 GDPR:"}</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>{"accesso ai propri dati personali e alle informazioni sul trattamento (art. 15);"}</li>
                <li>{"rettifica dei dati inesatti e integrazione di quelli incompleti (art. 16);"}</li>
                <li>{"cancellazione dei dati, nei casi previsti dall'art. 17, salvo che il trattamento sia necessario per adempiere un obbligo di legge o per eseguire un compito di interesse pubblico (art. 17, par. 3, lett. b);"}</li>
                <li>{"limitazione del trattamento (art. 18);"}</li>
                <li>{"opposizione al trattamento per motivi connessi alla propria situazione particolare (art. 21)."}</li>
              </ul>
              <p className="mb-2">{"Il diritto alla portabilità dei dati (art. 20) non si applica ai trattamenti necessari per l'esecuzione di un compito di interesse pubblico o connesso all'esercizio di pubblici poteri (art. 20, par. 3, GDPR)."}</p>
              <p className="mb-2">{"Le richieste possono essere inviate al Comune tramite PEC ("}<a href="mailto:sanlorenzodelvallo@asmepec.it" className="underline">{"sanlorenzodelvallo@asmepec.it"}</a>{") o e-mail ("}<a href="mailto:comune@sanlorenzodelvallo.eu" className="underline">{"comune@sanlorenzodelvallo.eu"}</a>{"), presentate all'Ufficio Protocollo, oppure rivolte al RPD ("}<a href="mailto:dpo@indoconsulting.it" className="underline">{"dpo@indoconsulting.it"}</a>{"). Il Comune risponde senza ingiustificato ritardo e comunque entro un mese dal ricevimento della richiesta, termine prorogabile di due mesi nei casi previsti dall'art. 12, par. 3, GDPR."}</p>
              <p className="mb-2">{"I diritti relativi ai dati degli alunni minorenni sono esercitati dai genitori o da chi ne esercita la responsabilità genitoriale."}</p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">{"12. Diritto di reclamo"}</h3>
              <p className="mb-2">{"Se ritiene che il trattamento dei Suoi dati personali avvenga in violazione del GDPR, ha il diritto di proporre reclamo al "}<strong>{"Garante per la protezione dei dati personali"}</strong>{" (art. 77 GDPR), Piazza Venezia 11, 00187 Roma, "}<a href="https://www.garanteprivacy.it" className="underline">{"www.garanteprivacy.it"}</a>{", PEC "}<a href="mailto:protocollo@pec.gpdp.it" className="underline">{"protocollo@pec.gpdp.it"}</a>{", oppure di adire le competenti sedi giudiziarie (art. 79 GDPR)."}</p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">{"13. Aggiornamenti dell'informativa"}</h3>
              <p className="mb-2">{"Il Titolare può modificare o aggiornare la presente informativa, anche in seguito a modifiche normative o organizzative. La versione vigente è sempre pubblicata in questa pagina, raggiungibile anche senza effettuare l'accesso."}</p>
            </section>

            <section className="border-t pt-4 mt-6">
              <p className="text-sm text-muted-foreground">
                <strong>Ultimo aggiornamento:</strong> 8 ottobre 2026
              </p>
            </section>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
