# Steg 1a: Orientera (Cykel 7 - TCK-008: live_listener)

## 1. Problembeskrivning & Målbild
Följ ADR-018 och systeminstruktionen genom att helt avlägsna alla tysta fallbacks till `speechSynthesis` i `liveListenerService.ts`.
- **Fail Fast principen**: Inga dolda syntetiska webbläsarröster eller dolda fallback-mekanismer i produktionskod i `src/features/live_listener/domain/liveListenerService.ts`.
- **Direkt felrapportering i klartext**: Alla anslutnings-, API- och hårdvarufel (ogiltig/saknad `GEMINI_API_KEY`, WebSocket-felkod 400/403/1006, fel vid kameraaktivering eller ljudfel) skall omedelbart redovisas i klartext i diagnostikraden (`updateDiagnosticStatus`).
- **Ljudutmatning**: Ljud från samtalslyssnaren i produktion kommer uteslutande via den skarpa PCM16-strömmen från Gemini Live API (`pcmPlayer.playChunk`).
- **Isolerade tester**: Eventuella stubs/mocks för tal och yttranden skall uteslutande konfigureras och exekveras i isolerade tester under `__tests__/`.

## 2. Inblandade domäner
- `src/features/live_listener/` (Kärndomän: `domain/liveListenerService.ts`, `__tests__/liveListenerService.test.ts`)
- `src/features/aac_display/` (Diagnostikradsvy som visar statusmeddelanden i klartext)

## 3. Tre fokuserade GROW-frågor mot risknoder
1. **Resilience & Fail Fast (ADR-018)**: Hur garanteras att `liveListenerService.ts` helt eliminerar tysta anrop till `window.speechSynthesis` och istället omedelbart rapporterar fel i klartext via `updateDiagnosticStatus` vid misslyckad anslutning eller saknad nyckel?
2. **Contract & Interface (speechSynthesizer & bakåtkompatibilitet i tester)**: Hur hanteras `speechSynthesizer`-fältet i `LiveListenerService` så att standardbeteendet i produktion är en no-op utan webbläsarfallback, samtidigt som enhetstester under `__tests__/` kan injicera mock-spies vid behov?
3. **State & Effects (Diagnostikradens klartext & Gemini Live PCM)**: Hur säkerställs att diagnostikraden omedelbart uppdateras med precisa felkoder (t.ex. `WS ERROR: 400 - Saknar API-nyckel`, `KAMERA-FEL: ...`) och att inga falska framgångsindikationer sker när anslutningen misslyckas?

```json
{
  "status": "IN_PROGRESS",
  "current_domain": "live_listener",
  "next_step": "1b_kartlagga",
  "ticket_id": "TCK-008",
  "active_skill": "gemini-live-api-dev"
}
```
