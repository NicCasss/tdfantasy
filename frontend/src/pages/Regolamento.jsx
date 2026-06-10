import React from "react";
import {
  LegalList,
  LegalPageLayout,
  LegalSection,
} from "../components/LegalPageLayout";

function Regolamento() {
  return (
    <LegalPageLayout title="Regolamento TDFantasy">
      <LegalSection title="1. Organizzatore">
        <p>TDFantasy è organizzato da:</p>

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

      <LegalSection title="2. Oggetto">
        <p>
          TDFantasy è un gioco fantasy gratuito collegato al torneo TDF.
        </p>

        <p>
          La piattaforma consente agli utenti registrati di creare una squadra
          fantasy, selezionare i giocatori disponibili, indicare un capitano e
          consultare punteggi e classifiche.
        </p>

        <p>
          Il nome, il logo, le grafiche e gli elementi identificativi del torneo
          sono utilizzati con autorizzazione dell’organizzazione.
        </p>
      </LegalSection>

      <LegalSection title="3. Partecipazione">
        <p>La partecipazione è gratuita.</p>

        <p>
          Per partecipare è necessario creare un account fornendo i dati
          richiesti dalla piattaforma e accettare il presente regolamento e
          l’informativa privacy.
        </p>

        <p>
          Ogni utente può creare una sola squadra fantasy, salvo diversa
          decisione dell’organizzazione.
        </p>

        <p>
          In caso di partecipazione di utenti minorenni, l’utilizzo della
          piattaforma deve avvenire sotto la responsabilità o con
          l’autorizzazione di un genitore o tutore.
        </p>
      </LegalSection>

      <LegalSection title="4. Riconoscimenti simbolici e gadget">
        <p>
          TDFantasy non prevede premi in denaro, vincite economiche o premi di
          valore commerciale rilevante.
        </p>

        <p>
          Sono previsti esclusivamente riconoscimenti simbolici e/o gadget di
          minimo valore, con finalità ricreativa e di intrattenimento.
        </p>

        <p>In particolare, l’organizzazione potrà assegnare:</p>

        <LegalList>
          <li>
            un riconoscimento simbolico o gadget al primo classificato di ogni
            giornata;
          </li>
          <li>
            riconoscimenti simbolici o gadget ai primi tre classificati della
            classifica complessiva finale.
          </li>
        </LegalList>

        <p>
          I riconoscimenti e i gadget non sono convertibili in denaro, non sono
          sostituibili con altri beni o servizi e non danno diritto ad alcuna
          forma di compenso economico.
        </p>
      </LegalSection>

      <LegalSection title="5. Creazione della rosa">
        <p>
          Ogni utente deve selezionare il numero di giocatori previsto dalle
          impostazioni del torneo.
        </p>

        <p>
          La selezione deve rispettare il budget massimo previsto dalla
          piattaforma.
        </p>

        <p>
          Il sistema impedisce il salvataggio di rose non valide, incomplete o
          superiori al budget disponibile.
        </p>
      </LegalSection>

      <LegalSection title="6. Capitano">
        <p>
          Ogni utente deve selezionare un capitano tra i giocatori presenti
          nella propria rosa.
        </p>

        <p>
          Il punteggio del capitano può essere moltiplicato secondo le regole
          definite dall’organizzazione.
        </p>
      </LegalSection>

      <LegalSection title="7. Deadline">
        <p>
          La creazione o modifica della rosa è consentita fino alla deadline
          indicata nella piattaforma.
        </p>

        <p>
          Dopo la deadline, la rosa può essere bloccata e non più modificabile.
        </p>

        <p>
          L’organizzazione può modificare la deadline per esigenze tecniche o
          organizzative.
        </p>
      </LegalSection>

      <LegalSection title="8. Punteggi">
        <p>
          I punteggi vengono calcolati sulla base di bonus, malus e regole
          stabilite dall’organizzazione.
        </p>

        <p>
          La piattaforma può aggiornare i punteggi in modalità live, semi-live o
          manuale, in base alla disponibilità dei dati.
        </p>
      </LegalSection>

      <LegalSection title="9. Classifiche">
        <p>
          La piattaforma mostra una classifica generale e classifiche di
          giornata.
        </p>

        <p>
          Le classifiche possono essere aggiornate durante il torneo e diventano
          definitive solo dopo la validazione dell’organizzazione.
        </p>
      </LegalSection>

      <LegalSection title="10. Errori tecnici o correzioni">
        <p>
          In caso di errore tecnico, dato errato, malfunzionamento o
          importazione non corretta dei punteggi, l’organizzazione si riserva il
          diritto di correggere manualmente i dati e ricalcolare le classifiche.
        </p>

        <p>
          Le decisioni dell’organizzazione sulla validità dei punteggi e delle
          classifiche sono considerate definitive.
        </p>
      </LegalSection>

      <LegalSection title="11. Comportamenti vietati">
        <p>È vietato:</p>

        <LegalList>
          <li>creare account falsi o multipli senza autorizzazione;</li>
          <li>tentare di alterare dati, classifiche o punteggi;</li>
          <li>accedere ad aree riservate senza autorizzazione;</li>
          <li>
            utilizzare la piattaforma in modo improprio o contrario alle
            finalità del gioco;
          </li>
          <li>
            interferire con il corretto funzionamento tecnico della piattaforma.
          </li>
        </LegalList>

        <p>
          In caso di violazione, l’organizzazione può sospendere o eliminare
          l’account dell’utente.
        </p>
      </LegalSection>

      <LegalSection title="12. Assenza di tracciamento marketing">
        <p>
          La piattaforma non utilizza sistemi di tracciamento marketing, cookie
          di profilazione, pixel pubblicitari, strumenti analytics o strumenti
          analoghi.
        </p>
      </LegalSection>

      <LegalSection title="13. Modifiche al regolamento">
        <p>
          L’organizzazione può modificare il presente regolamento per esigenze
          tecniche, organizzative o di corretto svolgimento del gioco.
        </p>

        <p>
          Le modifiche saranno rese disponibili attraverso la piattaforma.
        </p>
      </LegalSection>

      <LegalSection title="14. Contatti">
        <p>
          Per richieste o segnalazioni è possibile contattare l’organizzazione
          all’indirizzo{" "}
          <a
            href="mailto:torneo.tdf@gmail.com"
            className="font-black text-[#F26A00] underline"
          >
            torneo.tdf@gmail.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}

export default Regolamento;