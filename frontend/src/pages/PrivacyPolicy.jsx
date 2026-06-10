import React from "react";
import {
  LegalList,
  LegalPageLayout,
  LegalSection,
} from "../components/LegalPageLayout";

function PrivacyPolicy() {
  return (
    <LegalPageLayout title="Privacy Policy TDFantasy">
      <p>
        La presente informativa descrive come vengono trattati i dati personali
        degli utenti che utilizzano la piattaforma TDFantasy.
      </p>

      <LegalSection title="1. Titolare del trattamento">
        <p>Il titolare del trattamento è:</p>

        <p>
          <strong>Comitato organizzatore Tommy Vive</strong>
          <br />
          C.F. <strong>91057720673</strong>
          <br />
          Email di contatto:{" "}
          <a
            href="mailto:torneo.tdf@gmail.com"
            className="font-black text-[#F26A00] underline"
          >
            torneo.tdf@gmail.com
          </a>
        </p>
      </LegalSection>

      <LegalSection title="2. Dati personali trattati">
        <p>La piattaforma può trattare i seguenti dati:</p>

        <LegalList>
          <li>nome e cognome;</li>
          <li>indirizzo email;</li>
          <li>password in formato protetto e non leggibile;</li>
          <li>nome squadra fantasy;</li>
          <li>squadra scelta;</li>
          <li>rosa selezionata;</li>
          <li>capitano selezionato;</li>
          <li>punteggi, bonus, malus e classifiche;</li>
          <li>
            dati tecnici necessari al funzionamento della piattaforma, come log
            applicativi, informazioni di sicurezza e cookie tecnici di
            autenticazione.
          </li>
        </LegalList>

        <p>
          La piattaforma non conserva password in chiaro. Le password vengono
          gestite in formato protetto.
        </p>
      </LegalSection>

      <LegalSection title="3. Finalità del trattamento">
        <p>I dati vengono trattati per:</p>

        <LegalList>
          <li>creare e gestire l’account utente;</li>
          <li>permettere la partecipazione al gioco TDFantasy;</li>
          <li>salvare la rosa fantasy e il capitano;</li>
          <li>calcolare punteggi e classifiche;</li>
          <li>mostrare classifiche generali e di giornata;</li>
          <li>
            gestire eventuali riconoscimenti simbolici o gadget previsti dal
            regolamento;
          </li>
          <li>gestire richieste di assistenza;</li>
          <li>
            garantire sicurezza, prevenzione di abusi e corretto funzionamento
            tecnico della piattaforma.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="4. Base giuridica del trattamento">
        <p>
          Il trattamento dei dati è effettuato per consentire l’erogazione del
          servizio richiesto dall’utente, cioè la partecipazione a TDFantasy.
        </p>

        <p>
          Alcuni trattamenti tecnici e di sicurezza sono effettuati sulla base
          del legittimo interesse del titolare a proteggere la piattaforma,
          prevenire accessi non autorizzati e garantire il corretto
          funzionamento del servizio.
        </p>
      </LegalSection>

      <LegalSection title="5. Conservazione dei dati">
        <p>
          I dati vengono conservati per il tempo necessario alla gestione del
          torneo e per un periodo successivo ragionevole necessario a finalità
          tecniche, amministrative o di sicurezza.
        </p>

        <p>
          Al termine del periodo di conservazione, i dati potranno essere
          cancellati o anonimizzati.
        </p>
      </LegalSection>

      <LegalSection title="6. Destinatari dei dati">
        <p>
          I dati possono essere trattati tramite servizi tecnici necessari al
          funzionamento della piattaforma, come:
        </p>

        <LegalList>
          <li>provider di hosting;</li>
          <li>database;</li>
          <li>servizi email per recupero password o comunicazioni tecniche;</li>
          <li>
            eventuali servizi Google utilizzati per la gestione dei dati del
            torneo.
          </li>
        </LegalList>

        <p>I dati non vengono venduti a terzi.</p>
      </LegalSection>

      <LegalSection title="7. Cookie e strumenti tecnici">
        <p>
          La piattaforma utilizza esclusivamente cookie tecnici necessari al
          login, alla sicurezza e al corretto funzionamento dell’applicazione.
        </p>

        <p>
          Non vengono utilizzati cookie di profilazione, strumenti pubblicitari,
          pixel di marketing, sistemi analytics o sistemi di tracciamento per
          finalità commerciali.
        </p>
      </LegalSection>

      <LegalSection title="8. Diritti dell’utente">
        <p>
          L’utente può richiedere, nei limiti previsti dalla normativa
          applicabile:
        </p>

        <LegalList>
          <li>accesso ai propri dati;</li>
          <li>rettifica dei dati inesatti;</li>
          <li>cancellazione dei dati;</li>
          <li>limitazione del trattamento;</li>
          <li>opposizione al trattamento;</li>
          <li>informazioni sulla conservazione e sull’utilizzo dei dati.</li>
        </LegalList>

        <p>
          Le richieste possono essere inviate all’indirizzo email{" "}
          <a
            href="mailto:torneo.tdf@gmail.com"
            className="font-black text-[#F26A00] underline"
          >
            torneo.tdf@gmail.com
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="9. Reclamo">
        <p>
          L’utente ha il diritto di proporre reclamo all’autorità competente in
          materia di protezione dei dati personali, se ritiene che il
          trattamento dei propri dati violi la normativa applicabile.
        </p>
      </LegalSection>

      <LegalSection title="10. Modifiche alla presente informativa">
        <p>
          La presente informativa può essere aggiornata. In caso di modifiche
          rilevanti, gli utenti potranno essere informati attraverso la
          piattaforma o tramite comunicazione diretta.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}

export default PrivacyPolicy;