import React from "react";
import {
  LegalList,
  LegalPageLayout,
  LegalSection,
} from "../components/LegalPageLayout";

function CookiePolicy() {
  return (
    <LegalPageLayout title="Cookie Policy TDFantasy">
      <p>
        La presente Cookie Policy descrive l’utilizzo dei cookie e di tecnologie
        simili all’interno della piattaforma TDFantasy.
      </p>

      <LegalSection title="1. Cosa sono i cookie">
        <p>
          I cookie sono piccoli file salvati nel browser dell’utente che
          permettono al sito di funzionare correttamente, mantenere alcune
          informazioni tecniche e garantire una migliore esperienza di utilizzo.
        </p>
      </LegalSection>

      <LegalSection title="2. Cookie utilizzati da TDFantasy">
        <p>
          TDFantasy utilizza esclusivamente cookie tecnici necessari al
          funzionamento della piattaforma.
        </p>

        <p>In particolare, possono essere utilizzati cookie per:</p>

        <LegalList>
          <li>mantenere l’utente autenticato;</li>
          <li>proteggere la sessione di accesso;</li>
          <li>garantire la sicurezza dell’applicazione;</li>
          <li>
            permettere il corretto funzionamento delle funzionalità riservate
            agli utenti registrati.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="3. Cookie di profilazione e marketing">
        <p>
          TDFantasy non utilizza cookie di profilazione, strumenti pubblicitari,
          pixel marketing o sistemi di tracciamento per finalità commerciali.
        </p>
      </LegalSection>

      <LegalSection title="4. Cookie analytics">
        <p>
          TDFantasy non utilizza strumenti analytics di terze parti, come Google
          Analytics, Meta Pixel o sistemi analoghi.
        </p>

        <p>
          Qualora in futuro venissero introdotti strumenti analytics, cookie non
          tecnici o sistemi di tracciamento, la presente informativa sarà
          aggiornata e, ove necessario, verrà richiesto il consenso dell’utente.
        </p>
      </LegalSection>

      <LegalSection title="5. Gestione dei cookie">
        <p>
          L’utente può gestire o eliminare i cookie attraverso le impostazioni
          del proprio browser.
        </p>

        <p>
          La disattivazione dei cookie tecnici potrebbe impedire il corretto
          funzionamento della piattaforma, in particolare delle funzionalità di
          login e gestione account.
        </p>
      </LegalSection>

      <LegalSection title="6. Titolare">
        <p>Il titolare del trattamento è:</p>

        <p>
          <strong>Comitato organizzatore Tommy Vive</strong>
          <br />
          C.F. <strong>91057720673</strong>
          <br />
          Email:{" "}
          <a
            href="mailto:torneo.tdf@gmail.com"
            className="font-black text-[#F26A00] underline"
          >
            torneo.tdf@gmail.com
          </a>
        </p>
      </LegalSection>

      <LegalSection title="7. Aggiornamenti">
        <p>
          La presente Cookie Policy può essere aggiornata in caso di modifiche
          tecniche o funzionali della piattaforma.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}

export default CookiePolicy;