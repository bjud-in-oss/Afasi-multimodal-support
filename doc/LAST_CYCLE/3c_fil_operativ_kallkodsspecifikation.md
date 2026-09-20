# Steg 3c: Filoperativ källkodsspecifikation (Cykel 8 - TCK-008B)

## 1. Filoperativ källkodsspecifikation

### Fil 1: `src/features/live_listener/domain/liveListenerService.ts`
1. **Manuellt klick som aktivt samtycke**:
   - I `startListening()` och `confirmConsent()`:
     ```typescript
     this.consent = { granted: true, timestamp: Date.now() };
     this.status = "listening";
     this.notifyStatus();
     await this.activateSession();
     ```
   - Inga fördröjande röstmeddelanden eller syntetiska dialoger körs.
2. **Klartextdiagnostik vid saknad API-nyckel**:
   - I `initLiveWebSocket()`:
     ```typescript
     const key = import.meta.env?.VITE_GEMINI_API_KEY || (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : "");
     if (!key) {
       this.updateDiagnosticStatus("SAKNAR API-NYCKEL (VITE_GEMINI_API_KEY)");
       this.handleWebSocketError(400, "SAKNAR API-NYCKEL (VITE_GEMINI_API_KEY)");
       return;
     }
     ```
3. **Gemini 3.8 Live-protokollefterlevnad (`SKILL.md`)**:
   - I `ai.live.connect({ model, config, callbacks })`:
     - Sätt `inputAudioTranscription: {}`
     - Sätt `outputAudioTranscription: {}`
     - Sätt `behavior: "NON_BLOCKING"` på verktygsdeklarationen för `update_topic_zones`.
   - I `onmessage`:
     - Lyssna på `response.serverContent?.inputTranscription?.text` -> `this.handleIncomingText(..., "speaker-user")`.
     - Lyssna på `response.serverContent?.outputTranscription?.text` -> `this.handleIncomingText(..., "speaker-gemini")`.
     - Lyssna på `part.text` -> `this.handleIncomingText(part.text, "speaker-gemini")`.
     - Lyssna på `part.functionCall` och `response.toolCall?.functionCalls` -> `this.handleIncomingFunctionCall(...)`.
   - Textinteraktioner skickas med `sendRealtimeInput({ text: ... })`.
4. **Reaktiv avduplicering av brickor (`emitUtteranceWithDeduplication`)**:
   - Inför `private recentTilesCache: Map<string, number> = new Map();`
   - Rensa cacheposter äldre än 4000ms.
   - Filtrera bort inkommande brickor vars `iconKey` finns i cachen.
   - Lägg till kvarvarande unika brickor i cachen och anropa `this.options.onUtterance(event)` så att skärmen uppdateras i realtid utan dubletter.
   - All tolkning härleds från Geminis skarpa dataström (ADR-018).

### Fil 2: `src/features/live_listener/__tests__/liveListenerService.test.ts`
- Skapa enhetstester som verifierar:
  1. Manuellt klick på mikrofon (`startListening` / `confirmConsent`) sätter `consent.granted = true` direkt och triggar aktivering.
  2. Saknad API-nyckel sätter omedelbart diagnostikstatus till `"SAKNAR API-NYCKEL (VITE_GEMINI_API_KEY)"`.
  3. `update_topic_zones` deklareras med `behavior: "NON_BLOCKING"`.
  4. Transkriberad text (`inputTranscription` / `outputTranscription` / `part.text`) genererar reaktiva brickor.
  5. Identiska symboler som anländer via både transkription och `update_topic_zones` inom 4 sekunder avdupliceras och sänds bara en gång till `onUtterance`.
  6. Textprompt skickas via `sendRealtimeInput({ text })`.

### Fil 3: `src/features/live_listener/doc/BUSINESS_RULES.md`
- Regel 1: "Aktivt samtycke via manuellt klick: När användaren klickar på mikrofonknappen (startListening/confirmConsent) utgör handlingen ett aktivt samtycke (consent.granted = true). Ingen röstström analyseras eller skickas innan aktivt samtycke har givits, och sessionen aktiveras direkt utan fördröjande röstmeddelanden."
