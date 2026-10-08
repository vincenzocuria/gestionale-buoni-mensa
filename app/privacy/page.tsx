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
          <CardTitle className="text-2xl">Informativa sul trattamento dei dati personali</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            ai sensi degli artt. 13-14 del Regolamento UE 2016/679 (GDPR)
          </p>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <div className="space-y-6">
            <section>
              <h3 className="font-semibold text-lg mb-2">1. Titolare del trattamento</h3>
              <div className="bg-amber-50 border border-amber-200 rounded p-4">
                <p className="text-amber-900 font-medium">
                  ⚠️ DA COMPILARE A CURA DEL COMUNE
                </p>
                <p className="text-sm text-amber-800 mt-2">
                  Inserire: denominazione completa del Comune, indirizzo, PEC, telefono, email.
                </p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">2. Responsabile della Protezione dei Dati (DPO)</h3>
              <div className="bg-amber-50 border border-amber-200 rounded p-4">
                <p className="text-amber-900 font-medium">
                  ⚠️ DA COMPILARE A CURA DEL COMUNE
                </p>
                <p className="text-sm text-amber-800 mt-2">
                  Inserire: nome e cognome (o &quot;Non nominato&quot;), email, PEC, telefono del DPO se presente.
                  Se il Comune non ha nominato un DPO, indicare il riferimento dell&apos;ufficio competente.
                </p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">3. Finalità e base giuridica del trattamento</h3>
              <p className="mb-2">I dati personali (nome, cognome, codice fiscale dei minori e dei genitori/tutori) sono trattati per:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Gestione delle consegne dei blocchetti mensa;</li>
                <li>Registrazione dei pagamenti e dei bollettini PagoPA;</li>
                <li>Adempimenti contabili e amministrativi del Comune.</li>
              </ul>
              <div className="bg-amber-50 border border-amber-200 rounded p-4 mt-3">
                <p className="text-amber-900 font-medium">
                  ⚠️ DA VALIDARE CON DPO/LEGALE
                </p>
                <p className="text-sm text-amber-800 mt-2">
                  La base giuridica del trattamento è presumibilmente l&apos;<strong>obbligo di legge</strong> (art. 6.1.c GDPR)
                  e/o l&apos;<strong>esecuzione di un compito di interesse pubblico</strong> (art. 6.1.e GDPR).
                  Indicare i riferimenti normativi specifici (es. normativa comunale sui servizi scolastici, regolamento mensa).
                </p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">4. Categorie di dati trattati</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Dati anagrafici: nome, cognome, codice fiscale (del minore e del genitore/tutore);</li>
                <li>Dati relativi ai pagamenti: IUV, importi, date di pagamento e scadenza;</li>
                <li>Dati sulle consegne: numero di blocchetti consegnati, date di consegna.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">5. Destinatari dei dati</h3>
              <p className="mb-2">I dati possono essere comunicati a:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Personale interno del Comune autorizzato al trattamento;</li>
                <li>Soggetti esterni che forniscono servizi di supporto tecnico (responsabili del trattamento ex art. 28 GDPR).</li>
              </ul>
              <div className="bg-amber-50 border border-amber-200 rounded p-4 mt-3">
                <p className="text-amber-900 font-medium">
                  ⚠️ DA VERIFICARE E INTEGRARE
                </p>
                <p className="text-sm text-amber-800 mt-2">
                  Indicare eventuali altri destinatari (es. PagoPA, fornitori di servizi informatici, Regione, INPS).
                  Verificare che siano stipulati accordi ex art. 28 GDPR con i responsabili esterni.
                </p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">6. Trasferimento dati extra-UE</h3>
              <div className="bg-amber-50 border border-amber-200 rounded p-4">
                <p className="text-amber-900 font-medium">
                  ⚠️ DA VERIFICARE CON FORNITORI (Turso, Vercel)
                </p>
                <p className="text-sm text-amber-800 mt-2">
                  Verificare con Turso e Vercel l&apos;ubicazione dei server e se i dati vengono replicati fuori dall&apos;UE.
                  Se sì, indicare le garanzie adottate (clausole contrattuali standard UE, adeguatezza del Paese terzo, certificazioni).
                </p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">7. Periodo di conservazione</h3>
              <div className="bg-amber-50 border border-amber-200 rounded p-4">
                <p className="text-amber-900 font-medium">
                  ⚠️ DA DEFINIRE CON IL COMUNE
                </p>
                <p className="text-sm text-amber-800 mt-2">
                  Esempio: &quot;I dati sono conservati per 5 anni dalla conclusione dell&apos;anno scolastico di riferimento,
                  in conformità agli obblighi di conservazione contabile e amministrativa. Successivamente vengono cancellati.&quot;
                  Adattare in base alla normativa applicabile e alle esigenze del Comune.
                </p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">8. Diritti dell&apos;interessato</h3>
              <p className="mb-2">
                Gli interessati (genitori/tutori e, se maggiorenni, gli stessi beneficiari) hanno diritto di:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Accesso</strong> (art. 15): ottenere conferma e copia dei dati trattati;</li>
                <li><strong>Rettifica</strong> (art. 16): correggere dati inesatti;</li>
                <li><strong>Cancellazione</strong> (art. 17): richiedere la cancellazione, salvo obblighi di legge;</li>
                <li><strong>Limitazione</strong> (art. 18): limitare il trattamento in determinati casi;</li>
                <li><strong>Portabilità</strong> (art. 20): ricevere i dati in formato strutturato, ove applicabile;</li>
                <li><strong>Opposizione</strong> (art. 21): opporsi al trattamento, salvo motivi legittimi cogenti.</li>
              </ul>
              <div className="bg-amber-50 border border-amber-200 rounded p-4 mt-3">
                <p className="text-amber-900 font-medium">
                  ⚠️ DA INTEGRARE CON CONTATTI E PROCEDURA
                </p>
                <p className="text-sm text-amber-800 mt-2">
                  Indicare come esercitare i diritti: email, PEC, moduli, ufficio di riferimento.
                  Specificare che il Comune risponde entro 1 mese (art. 12.3 GDPR).
                </p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">9. Diritto di reclamo</h3>
              <p>
                Gli interessati hanno il diritto di proporre reclamo al{" "}
                <strong>Garante per la protezione dei dati personali</strong> se ritengono che il trattamento violi il GDPR.
              </p>
              <p className="mt-2">
                Contatti Garante: <a href="https://www.garanteprivacy.it" className="text-blue-600 underline">www.garanteprivacy.it</a>
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg mb-2">10. Misure di sicurezza</h3>
              <p>
                Il Comune adotta misure tecniche e organizzative adeguate per proteggere i dati personali da accessi non autorizzati,
                perdita o distruzione, tra cui: autenticazione degli operatori, crittografia delle comunicazioni (HTTPS),
                backup periodici, limitazione degli accessi al personale autorizzato.
              </p>
            </section>

            <section className="border-t pt-4 mt-6">
              <p className="text-sm text-muted-foreground">
                <strong>Ultimo aggiornamento:</strong> 8 ottobre 2026
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                ⚠️ <strong>ATTENZIONE:</strong> Questa informativa deve essere revisionata e completata a cura del Comune in collaborazione con il DPO
                e/o un consulente legale esperto in privacy. Le sezioni evidenziate in giallo con &quot;DA COMPILARE&quot; richiedono integrazione
                prima della pubblicazione definitiva.
              </p>
            </section>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
