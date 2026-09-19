# Steg 1a: Orientera (Cykel 6 - TCK-006C: live_listener)

## 1. Problembeskrivning & Målbild
Implementera äkta Gemini Live API-integration, kontrollerad och dynamisk kameravision samt tidsmedvetenhet för det textlösa afasisystemet:
- **Äkta Gemini Live integration**: Använd modellen `models/gemini-3.8-live` över WebSockets med den officiella `@google/genai` SDK:n för dubbelriktad realtidsströmning (audio in/ut och multimodal bildinmatning).
- **En enda kontrollerad kamerainstans med dynamisk frekvensreglering**:
  - Exklusiv instans av `getUserMedia` som stängs av fullständigt och omedelbart (`track.stop()`) när mikrofonen/lyssnandet deaktiveras.
  - **Minimitid (Rate Limiter)**: Strikt spärr med absolut lägsta gräns om minst 1.0 sekund mellan bildrutor (max 1 frame per sekund).
  - **Vilopuls (Idle)**: Skicka bild var 5.0 sekund när rummet är stilla och inget händer.
  - **Burst-läge (Gasa upp)**: Sätt frekvensen till var 1.5 sekund i 6 sekunder vid händelser (talarväxling, skärmtryck/användarinteraktion) eller när en lokal Pixel-Delta rörelsedetektor i Canvas upptäcker förändringar/rörelser i rummet.
- **Ljudaktivering i klick-handler**: Garantera att `audioContext.resume()` (eller `pcmPlayer.resume()`) anropas direkt synkront i klick-handlern för mikrofonknappen (`onToggleListening` / `toggleListening`) innan asynkrona processer påbörjas, vilket tillfredsställer webbläsarnas Autoplay Policy.
- **Tidsmedvetenhet (Temporal Context)**: Injicera realtidsorienterad tidsinformation (aktuell lokal svensk tid, veckodag, fas på dygnet såsom morgon, lunch, fika, kväll) i systeminstruktionerna för att förankra Geminis tolkning och symbolförslag i nuet.
- **Inkommande PCM16-ljudström**: Ersätt all lokal webbtalsyntes (`speechSynthesis`) med Geminis direkta inkommande PCM16 (24kHz little-endian) ljudström via `AudioContext`, inklusive omedelbart avbrott (`interrupted: true`) vid ny användarinmatning.

## 2. Inblandade domäner
- `src/features/live_listener/` (Primär domän: `domain/liveListenerService.ts`, `domain/cameraManager.ts`, `domain/pcmPlayer.ts`, `domain/temporalContext.ts`, `domain/types.ts`, `hooks/useLiveListener.ts`)
- `src/features/aac_display/` (Mottagare av realtidsuppdaterade samtalszoner, brickor och klick-handler i `UserControlZone` / `useAacDisplay`)
- `src/features/symbol_engine/` (Mappning mellan tolkade yttranden och tillgängliga symbolikoner)

## 3. Tre fokuserade GROW-frågor mot risknoder
1. **Contract & Options (WebSocket & Gemini 3.8 Live)**: Hur struktureras anslutningen mot `models/gemini-3.8-live` via `@google/genai` med `responseModalities: ['audio']`, systeminstruktion med lokal tidskontext och asynkron funktionsanropning (`update_topic_zones`) för att garantera en robust och typsäker kontraktsefterlevnad?
2. **State & Resilience (Kamerans livscykel, Resursfrigöring & Dynamisk Frekvens)**: Hur garanteras att kameraströmmen (`getUserMedia`) exklusivt ägs av en kontrollerad singleton, att alla videospår termineras vid mikrofonavstängning, samt att bildfrekvensen dynamiskt regleras mellan 5.0 s (vilopuls) och 1.5 s (burst vid rörelse/talarväxling/skärmtryck) med en absolut rate limit på 1.0 s?
3. **Effects & Way Forward (Web Audio Autoplay, PCM16-uppspelning & Avbrottshantering)**: Hur säkerställs att `audioContext.resume()` anropas direkt i mikrofonens klick-handler för att undvika blockerande autoplay-begränsningar, och hur hanteras avkodning och omedelbart avbrott (`interrupted: true`) av PCM16 24kHz i Web Audio API?

```json
{
  "status": "IN_PROGRESS",
  "current_domain": "live_listener",
  "next_step": "1b_kartlagga",
  "ticket_id": "TCK-006C",
  "active_skill": "gemini-live-api-dev"
}
```
