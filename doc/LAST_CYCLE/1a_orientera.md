# Steg 1a: Orientera (Cykel 8 - TCK-008B: Direkta klick & Gemini 3.8 Live-protokoll)

## 1. Problembeskrivning & Målbild
Uppdatera och anpassa samtalslyssnaren i `liveListenerService.ts` enligt de officiella protokollkraven i `gemini-live-api-dev/SKILL.md` och ADR-018:

1. **Manuellt klick som aktivt samtycke**:
   - När användaren klickar på mikrofonknappen (`startListening` / `confirmConsent`) utgör själva handlingen ett aktivt samtycke.
   - Sätt `consent.granted = true` och anropa `activateSession()` direkt utan fördröjande röstmeddelande eller syntetiska väntelägen.
   - Uppdatera Regel 1 i `src/features/live_listener/doc/BUSINESS_RULES.md` så att dokumentationen återspeglar att manuellt klick utgör giltigt samtycke.

2. **Garantera skarp hantering enligt Gemini 3.8 Live-protokollet (`SKILL.md`)**:
   - **Asynkront verktygsanrop**: Deklarera verktyget `update_topic_zones` med `behavior: "NON_BLOCKING"` så att Gemini kan utföra asynkrona verktygsanrop i bakgrunden utan att röst- och bildströmmen avbryts.
   - **Transkriptionskonfiguration**: Konfigurera `inputAudioTranscription: {}` och `outputAudioTranscription: {}` i `LiveConnectConfig` för att ta emot skarpa texttranskriptioner (`serverContent.inputTranscription?.text` och `serverContent.outputTranscription?.text`) direkt över WebSocket.
   - **Textimpulser via realtime-input**: Skicka alla användarinteraktioner och textimpulser via `sendRealtimeInput({ text: ... })` i enlighet med `SKILL.md` (undvik `sendClientContent` med `turnComplete: true` som orsakar oönskade avbrott i modellens aktiva talström).
   - **Reaktiva AAC-brickor & Avduplicering**: När Gemini skickar transkriberad text (`inputTranscription` / `outputTranscription` / `modelTurn.parts`) skall relevanta AAC-brickor genereras och visas på skärmen i realtid. Avduplicering implementeras mellan transkriptionshanteraren och `handleIncomingFunctionCall` (`update_topic_zones`) så att samma begrepp inte skapar dubblerade brickor. All ordtolkning skall härledas uteslutande från Geminis skarpa dataström (ADR-018).

3. **Tydlig felrapportering vid saknad nyckel (Fail Fast / ADR-018)**:
   - Om varken `VITE_GEMINI_API_KEY` eller `process.env.GEMINI_API_KEY` identifieras vid start skall diagnostikraden omedelbart visa `"SAKNAR API-NYCKEL (VITE_GEMINI_API_KEY)"` i klartext via `updateDiagnosticStatus`.

## 2. Inblandade domäner
- `src/features/live_listener/` (`domain/liveListenerService.ts`, `__tests__/liveListenerService.test.ts`, `doc/BUSINESS_RULES.md`)
- `src/features/aac_display/` (Diagnostikrad och presentation av reaktiva AAC-brickor i zoner)

## 3. Tre fokuserade GROW-frågor mot faktiska risknoder
1. **State & Contract (Manuellt klick & sessionstillstånd)**: Hur garanteras att användarens manuella klick på mikrofonknappen direkt sätter `consent.granted = true` och aktiverar sessionen utan att introducera tillståndskonflikter, dolda talsynteser eller asynkrona kapplöpningar?
2. **Contract & Effects (Gemini 3.8 Live-protokoll & non-blocking tools)**: Hur konfigureras `LiveConnectConfig` med `behavior: "NON_BLOCKING"`, `inputAudioTranscription` och `outputAudioTranscription`, samt hur säkerställs att `sendRealtimeInput({ text: ... })` används istället för `sendClientContent` för att förhindra avbrutet modell-tal?
3. **Resilience & Fail Fast (Avduplicering & API-nyckeldiagnostik)**: Hur designas den gemensamma avdupliceraren för transkription och `update_topic_zones` så att samma begrepp aldrig renderas två gånger, och hur säkerställs att `"SAKNAR API-NYCKEL (VITE_GEMINI_API_KEY)"` omedelbart syns i diagnostikraden vid start om nyckel saknas?

```json
{
  "status": "IN_PROGRESS",
  "current_domain": "live_listener",
  "next_step": "1b_kartlagga",
  "ticket_id": "TCK-008B",
  "active_skill": "gemini-live-api-dev"
}
```
