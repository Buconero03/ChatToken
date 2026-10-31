# Context Guardian 1.3.0 — Installazione multipiattaforma

**Il conteggio è identico in tutti i pacchetti:** stesso motore JavaScript, stessa codifica BPE `o200k_base`, stesso avviso a 240.000 token storici rispetto alla soglia operativa 250.000.

### Chrome, Microsoft Edge, Brave, Opera, Vivaldi

1. Scarica il pacchetto `Context_Guardian_v1.3.0_CHROMIUM.zip`.
2. Estrai lo ZIP (non caricare lo ZIP direttamente).
3. Apri la schermata delle estensioni del browser, ad esempio `chrome://extensions`, `edge://extensions` oppure `brave://extensions`.
4. Attiva Modalità sviluppatore, clicca **Carica estensione non pacchettizzata** e scegli la cartella estratta con `manifest.json`.
5. Apri ChatGPT e ricarica la scheda una sola volta. Disattiva prima le vecchie versioni di Context Guardian.

### Mozilla Firefox

1. Scarica `Context_Guardian_v1.3.0_FIREFOX.zip` ed estrailo.
2. Apri `about:debugging#/runtime/this-firefox`.
3. Premi **Load Temporary Add-on** e seleziona il file `manifest.json` estratto.
4. Ricarica la conversazione ChatGPT. La versione temporanea sparisce quando riavvii Firefox.
5. Per un'installazione permanente per gli utenti sarà necessaria la distribuzione con firma Mozilla AMO.

### Safari (Mac)

Il pacchetto `Context_Guardian_v1.3.0_SAFARI.zip` contiene i sorgenti per Safari WebExtension. **Non è un'app Safari installabile direttamente**. Richiede la conversione attraverso gli strumenti Apple e una prova sul dispositivo.

Sul Mac con Xcode è possibile eseguire `xcrun safari-web-extension-packager /percorso/della/cartella/estratta` e seguire le istruzioni della procedura. In alternativa Apple offre una procedura di confezionamento tramite App Store Connect.

### Precisazione sul contesto

Il contatore misura i token del testo storico recuperato. Non conosce direttamente il contesto attivo del modello. La soglia 250.000 è un riferimento operativo configurato nel progetto, non un limite ufficiale verificato di tutte le chat.

### Trasparenza sui test

Sono stati eseguiti test automatizzati del motore, del packaging e delle API di background con simulazione Firefox. L'installazione autenticata e la lettura reale da ChatGPT vanno ancora verificate su Edge, Firefox, Brave, Opera e Safari. L'ambiente di test non consente la navigazione simulata verso `chatgpt.com`.
