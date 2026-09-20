# Steg 1b: Kartlägga (Cykel 7 - TCK-008: live_listener)

## 1. Besvarande av GROW-frågorna

### Svar på Fråga 1 (Resilience & Fail Fast / ADR-018)
I `liveListenerService.ts` avlägsnas referensen till `window.speechSynthesis` helt i konstruktorn. Istället för att i det tysta försöka tala via webbläsarens syntes, sätts standardvärdet för `this.speechSynthesizer` till en tom funktion `() => {}`. Vid eventuella anslutningsfel, saknad API-nyckel eller hårdvarufel kallas `updateDiagnosticStatus` direkt med tydliga felkoder i klartext (t.ex. `WS ERROR: 400 - Saknar API-nyckel (GEMINI_API_KEY saknas i miljö)`).

### Svar på Fråga 2 (Contract & Interface / Testisolering)
Fältet `this.speechSynthesizer` och metoden `setSpeechSynthesizer(fn)` behålls som en ren hook för testmockning under `__tests__/`. I produktion aktiveras aldrig webbläsarens `speechSynthesis`. Samtyckesstatus `awaiting_consent` uppdaterar diagnostikraden med `Gemini Event: session.awaiting_consent`, men genererar ingen dold webbtalsyntes.

### Svar på Fråga 3 (State & Effects / Klartext & PCM)
Alla ljudsignaler under körning i produktion hanteras av `PcmPlayer` matad av inkommande binära PCM16-chunks från Gemini Live WebSockets (`handleIncomingModelAudio`). Om WebSocket avbryts eller kastar fel, fångas detta i `onerror` / `onclose` / `catch` och skickas direkt till `handleWebSocketError` / `handleWebSocketClose`, vilket uppdaterar `lastEventStatus` och propageras till diagnostikraden i UI:t utan tysta undantag eller skenbeteenden.

## 2. Aktiva vektorer & Vägval
Ändringen berör resiliens och strikt felrapportering utan dolda fallbacks. Vi väljer en enda aktiv vektor (`Resilience`), vilket ger $V = 1 < 2$ och aktiverar linjärt snabbspår.

```json
{
  "active_vectors": ["Resilience"],
  "mode": "linear",
  "ticket_id": "TCK-008",
  "next_step": "2a_forandra_utat_vision"
}
```
