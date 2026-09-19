# Steg 1b: Kartlägga (Cykel 6 - TCK-006C: live_listener)

## 1. Besvarande av GROW-frågorna (Arkitektonisk syntes)

### Fråga 1 (Contract & Options - WebSocket & Gemini 3.8 Live):
- **Modell & SDK**: Använder officiella `@google/genai` med `ai.live.connect({ model: 'models/gemini-3.8-live', config: ... })` över WebSockets enligt `gemini-live-api-dev`.
- **Modaliteter**: `responseModalities: ['audio']` för nativ ljud- och röstgenerering.
- **Tidsmedvetenhet (Temporal Grounding)**: Vid sessionsstart injiceras aktuell lokal tid och tidsram (t.ex. datum, klockslag, dygnstillfälle som morgon/fika/lunch/kväll) i `systemInstruction` samt vid behov via `sendClientContent` vid tidsövergångar. Detta gör att Gemini förstår kontextuella referenser till t.ex. "frukost", "kaffe", "vila" i förhållande till klockan.
- **Funktionsanrop**: Verktygskonfiguration med `update_topic_zones` (med `behavior: 'NON_BLOCKING'`) som uppdaterar afasi-brickorna kontinuerligt medan samtalet och ljudet strömmar.

### Fråga 2 (State & Resilience - En kontrollerad kamerainstans):
- **Exklusiv instanshantering**: Skapa en dedikerad `CameraStreamController` med intern referens och singleton-semantik.
- **Livscykelkoppling**: Kameran startas endast när användaren har gett samtycke och aktiverat lyssnandet.
- **Säker nedstängning**: När mikrofonen/lyssnandet stängs av (`stopListening` eller `pauseListening`) anropas `cameraController.stop()` som omedelbart anropar `track.stop()` på samtliga aktiva spår i `MediaStream`, sätter strömmen till `null` och frigör eventuell `<video>`/`<canvas>`-resurs. Detta släpper webbkameran och säkerställer att hårdvaruindikatorn släcks.
- **Bildströmning**: Bildrutor tas som komprimerade JPEG-frames i måttlig frekvens (t.ex. 1 fps eller vid talarväxling) och skickas via `session.sendRealtimeInput({ video: { data: base64, mimeType: 'image/jpeg' } })`.

### Fråga 3 (Effects & Way Forward - Inkommande PCM16-ljud & Avbrott):
- **Utmönstring av talsyntes**: Lokal `window.speechSynthesis` avlägsnas helt som ljudkälla för Geminis yttranden.
- **PCM16 24kHz avspelning**: Inkommande ljudpaket (`serverContent.modelTurn.parts` med `inlineData`) avkodas från base64 till 16-bitars PCM little-endian (Int16Array) och konverteras till 32-bitars float för avspelning via Web Audio API `AudioContext` vid 24000 Hz samplingsfrekvens.
- **Avbrottshantering (Barge-in / Interruption)**: När servern skickar `serverContent.interrupted === true` töms ljudkön omedelbart och pågående ljudkällor termineras (`source.stop()`), vilket ger omedelbar tystnad när samtalspartnern börjar tala igen.

---

## 2. Vektoranalys & Risknoder
- **`Resilience`**: Hårdvaruresurser (kamera + mikrofon) och nätverksresiliens (WebSocket reconnection & timeout handling).

```json
{
  "active_vectors": ["Resilience"],
  "vector_count": 1,
  "execution_mode": "linear",
  "status": "COMPLETED",
  "next_step": "2a_forandra_utat_vision"
}
```
