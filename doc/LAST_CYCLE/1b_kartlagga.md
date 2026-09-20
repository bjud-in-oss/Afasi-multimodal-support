# Steg 1b: Kartlägga (Cykel 8 - TCK-008B: Direkta klick & Gemini 3.8 Live-protokoll)

## 1. Besvarande av GROW-frågorna

### Svar på Fråga 1 (State & Contract: Manuellt klick & sessionstillstånd)
I `liveListenerService.ts`:
- När `startListening()` eller `confirmConsent()` anropas sätts `this.consent = { granted: true, timestamp: Date.now() }` omedelbart utan att vänta på något muntligt bekräftelsemeddelande.
- `this.status` övergår direkt till `"listening"` och `activateSession()` körs utan fördröjning.
- Alla anrop till webbläsarens syntetiska tal (`speechSynthesis`) är sedan tidigare borttagna och förblir no-op (`_text => {}`).
- Affärsregel 1 i `src/features/live_listener/doc/BUSINESS_RULES.md` fastslår formellt att manuellt klick på mikrofonknappen utgör giltigt aktivt samtycke.

### Svar på Fråga 2 (Contract & Effects: Gemini 3.8 Live-protokoll & Non-blocking tools)
Enligt specifikationen i `doc/skills/gemini-live-api-dev/SKILL.md`:
- **Icke-blockerande verktyg**: I `tools[0].functionDeclarations` sätts:
  ```typescript
  {
    name: "update_topic_zones",
    description: "Skapar eller uppdaterar AAC-bildbrickor på skärmen baserat på vad samtalspartnern säger.",
    behavior: "NON_BLOCKING", // Tillåter kontinuerlig audio-/videoströmning utan avbrott
    parameters: { ... }
  }
  ```
- **Transkriptioner**: I `LiveConnectConfig`:
  ```typescript
  inputAudioTranscription: {},
  outputAudioTranscription: {},
  ```
  Detta instruerar Gemini 3.8 Live att skicka både inkommande användartal (`response.serverContent.inputTranscription`) och modellens tal (`response.serverContent.outputTranscription`) som ren text i WebSocket-strömmen.
- **Textimpulser via realtime-input**: Vid textinmatning eller snabbval anropas `session.sendRealtimeInput({ text: inputString })`. Vi undviker strikt `sendClientContent` med `turnComplete: true`, eftersom `turnComplete: true` omedelbart klipper modellens aktiva röstgenerering.

### Svar på Fråga 3 (Resilience & Fail Fast: Avduplicering & API-nyckeldiagnostik)
- **Avduplicering**: En gemensam cache `recentTilesCache: Map<string, number>` införs med 4000ms TTL.
  - När text anländer via `inputTranscription`, `outputTranscription` eller `modelTurn.parts[].text` körs texten genom `defaultSymbolEngine.matchSymbols(text)`.
  - När `update_topic_zones` anländer via `handleIncomingFunctionCall` extraheras de strukturerade brickorna.
  - Båda källorna passerar metoden `emitUtteranceWithDeduplication(speakerId, text, tiles)`. Den filtrerar bort brickor vars `iconKey` nyligen har emitterats inom tidsfönstret (4s), uppdaterar cachen och avfyrar `onUtterance(event)` enbart för nya unika brickor. All tolkning härleds från Geminis faktiska dataström (ADR-018).
- **Diagnostik vid saknad nyckel**: Vid initiering av WebSocket i `initLiveWebSocket()`:
  ```typescript
  const key = import.meta.env?.VITE_GEMINI_API_KEY || (typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : "");
  if (!key) {
    this.updateDiagnosticStatus("SAKNAR API-NYCKEL (VITE_GEMINI_API_KEY)");
    this.handleWebSocketError(400, "SAKNAR API-NYCKEL (VITE_GEMINI_API_KEY)");
    return;
  }
  ```
  Detta ger omedelbar, entydig feedback i diagnostikgränssnittet utan tysta simuleringar.

## 2. Aktiva vektorer & Vägval
Förändringen berör resiliens och strikt Gemini 3.8 Live-protokollefterlevnad. Vektor sätts till `Resilience` ($V = 1 < 2$), vilket aktiverar linjärt läge.

```json
{
  "active_vectors": ["Resilience"],
  "mode": "linear",
  "ticket_id": "TCK-008B",
  "next_step": "2a_forandra_utat_vision"
}
```
