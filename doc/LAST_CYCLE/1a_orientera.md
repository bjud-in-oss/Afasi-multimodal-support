# Steg 1a: Orientera (Cykel 6 - TCK-006C: live_listener)

## 1. Problembeskrivning & Målbild
Implementera äkta Gemini Live API-integration, kontrollerad kameravision och tidsmedvetenhet för det textlösa afasisystemet:
- **Äkta Gemini Live integration**: Använd modellen `models/gemini-3.8-live` över WebSockets med den officiella `@google/genai` SDK:n för dubbelriktad realtidsströmning (audio in/ut och multimodal bildinmatning).
- **En enda kontrollerad kamerainstans**: Skapa en strikt hanterad livscykel för `getUserMedia`-kameraflödet. Säkerställ att det enbart finns en enda aktiv instans i minnet, och att alla tracks (`track.stop()`) stängs av fullständigt och omedelbart så fort mikrofonen/sessionen pausas eller deaktiveras.
- **Tidsmedvetenhet (Temporal Context)**: Injicera realtidsorienterad tidsinformation (aktuell lokal tid, veckodag, fas på dygnet såsom morgon, lunch, fika, kväll) i systeminstruktionerna och sessionskontexten för att förankra Geminis tolkning och symbolförslag i nuet.
- **Inkommande PCM16-ljudström**: Ersätt all lokal webbtalsyntes (`speechSynthesis`) med Geminis direkta inkommande PCM16 (24kHz little-endian) ljudström via `AudioContext`, inklusive omedelbart avbrott (`interrupted: true`) vid ny användarinmatning.

## 2. Inblandade domäner
- `src/features/live_listener/` (Primär domän: `domain/liveListenerService.ts`, `domain/types.ts`, `hooks/useLiveListener.ts`, kamera- och audio-hanterare)
- `src/features/aac_display/` (Mottagare av realtidsuppdaterade samtalszoner och symbolbrickor)
- `src/features/symbol_engine/` (Mappning mellan tolkade yttranden och tillgängliga symbolikoner)

## 3. Tre fokuserade GROW-frågor mot risknoder
1. **Contract & Options (WebSocket & Gemini 3.8 Live)**: Hur struktureras anslutningen mot `models/gemini-3.8-live` via `@google/genai` med `responseModalities: ['audio']`, systeminstruktion med lokal tidskontext och asynkron funktionsanropning (`update_topic_zones`) för att garantera en robust och typsäker kontraktsefterlevnad?
2. **State & Resilience (Kamerans livscykel & Resursfrigöring)**: Hur garanteras att kameraströmmen (`getUserMedia`) exklusivt ägs av en kontrollerad singleton/ref-manager, så att kameraindikatorn/hårdvaran stängs av omedelbart och spår termineras när mikrofonen stängs av?
3. **Effects & Way Forward (PCM16-ljuduppspelning & Avbrottshantering)**: Hur realiseras avkodning och sömlös uppspelning av inkommande PCM16 24kHz i Web Audio API `AudioContext` så att lokal talsyntes elimineras och pågående uppspelning kan avbrytas inom millisekunder vid ett `interrupted`-event från Gemini?

```json
{
  "status": "IN_PROGRESS",
  "current_domain": "live_listener",
  "next_step": "1b_kartlagga",
  "ticket_id": "TCK-006C",
  "active_skill": "gemini-live-api-dev"
}
```
