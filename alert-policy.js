/* Context Guardian threshold policy. Explicit operational preference,
   never the measured context-window capacity. */
(() => {
  'use strict';
  const LIMIT=250_000;
  const ALERT_BEFORE=10_000;
  const WARNING=LIMIT-ALERT_BEFORE;
  function evaluate(total, complete){
    if (!Number.isFinite(total) || total<0) return {level:'unknown',counted:null,remaining:null,ratio:null,complete:!!complete};
    const counted=Math.trunc(total);
    const level=counted>=LIMIT?'exceeded':counted>=WARNING?'warning':'normal';
    return {level,counted,remaining:Math.max(0,LIMIT-counted),ratio:Math.min(1,counted/LIMIT),complete:!!complete};
  }
  const PDF_REQUEST=`Prepara un PDF professionale di passaggio consegne del progetto trattato in questa conversazione, da utilizzare per continuare il lavoro in una nuova chat.\n\nIncludi: 1) obiettivi e ambito; 2) architettura e componenti; 3) stato del codice e funzionalità implementate; 4) decisioni tecniche consolidate; 5) file, directory, repository e comandi di avvio disponibili; 6) test eseguiti con risultati e prove; 7) problemi aperti, vincoli e rischi; 8) attività successive ordinate per priorità; 9) istruzioni operative per riprendere esattamente dal punto corrente.\n\nMantieni dettagli tecnici, comandi e nomi esatti quando presenti. Distingui chiaramente FATTO, VERIFICATO, IPOTESI e DA ESEGUIRE. Non inventare risultati, hash, percorsi o test. Inserisci una sezione finale \"Prompt per nuova chat\" con le istruzioni indispensabili alla ripresa.\n\nGenera direttamente il PDF scaricabile, se disponibile. In caso contrario crea un documento completo, ordinato e pronto per essere esportato in PDF.`;
  globalThis.CGAlertPolicy=Object.freeze({LIMIT,ALERT_BEFORE,WARNING,evaluate,PDF_REQUEST});
})();
