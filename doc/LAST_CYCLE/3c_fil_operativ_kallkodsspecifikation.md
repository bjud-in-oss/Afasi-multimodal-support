# Steg 3c: Filoperativ källkodsspecifikation (Cykel 7 - TCK-008)

## 1. Berörda filer & Planerade ändringar

### A. `src/features/live_listener/domain/liveListenerService.ts`
- **Konstruktor**:
  Ersätt blocket som binder `this.speechSynthesizer` till `window.speechSynthesis` med en tom no-op funktion:
  ```typescript
  // Inga tysta fallbacks till browserns window.speechSynthesis enligt ADR-018
  this.speechSynthesizer = (text: string) => {};
  ```
- **Kamerastart i activateSession**:
  Svep `await this.cameraManager.start()` i en try-catch och rapportera fel i klartext:
  ```typescript
  if (this.options.enableCamera !== false) {
    try {
      await this.cameraManager.start();
      this.notifyCameraStatus();
      this.scheduleNextCameraFrame();
    } catch (err: any) {
      this.updateDiagnosticStatus(`KAMERA-FEL: ${err?.message || "Kunde inte starta kamera"}`);
    }
  }
  ```
- **Samtycke & Felhantering**:
  Rensa eventuella förväntningar på syntetiskt tal och förtydliga felrapporteringen i `updateDiagnosticStatus`.

### B. `src/features/live_listener/__tests__/liveListenerService.test.ts`
- Verifiera att `window.speechSynthesis.speak` inte anropas i produktion vid `startListening` eller `confirmConsent`.
- Verifiera att eventuella anslutningsfel och felkoder omedelbart exponeras via `getLastEventStatus()` i klartext.
