# Steg 1b: Kartlägga (Cykel 6 - TCK-006C: live_listener)

## 1. Besvarande av GROW-frågorna (Arkitektonisk syntes)

### Fråga 1 (Contract & Options - WebSocket & Gemini 3.8 Live):
- **Modell & SDK**: Använder officiella `@google/genai` med `ai.live.connect({ model: 'models/gemini-3.8-live', config: ... })` över WebSockets enligt `gemini-live-api-dev`.
- **Modaliteter**: `responseModalities: ['audio']` för nativ ljud- och röstgenerering.
- **Tidsmedvetenhet (Temporal Grounding)**: Vid sessionsstart injiceras aktuell lokal tid och tidsram (datum, klockslag, dygnstillfälle som morgon/fika/lunch/kväll) i `systemInstruction` samt vid behov via `sendClientContent` vid tidsövergångar. Detta gör att Gemini förstår kontextuella referenser till t.ex. "frukost", "kaffe", "vila" i förhållande till klockan.
- **Funktionsanrop**: Verktygskonfiguration med `update_topic_zones` (med `behavior: 'NON_BLOCKING'`) som uppdaterar afasi-brickorna kontinuerligt medan samtalet och ljudet strömmar.

### Fråga 2 (State & Resilience - En kontrollerad kamerainstans & Dynamisk Frekvensmotor):
- **Exklusiv instanshantering**: Skapa `CameraManager` som singleton-kontroller för `getUserMedia`.
- **Livscykelkoppling & Ren Nedstängning**: Kameran startas endast vid aktiv session. När mikrofonen/lyssnandet stängs av (`stopListening` eller `pauseListening`) anropas `cameraManager.stop()` som omedelbart anropar `track.stop()` på samtliga aktiva videospår i `MediaStream`, sätter strömmen till `null`, frigör interna resurser och släcker webbkamerans hårdvaruindikator.
- **Dynamisk Frekvensreglering**:
  - **Rate Limiter (Absolut lägsta gräns)**: `MIN_INTERVAL_MS = 1000` (aldrig oftare än 1.0 s mellan sända bildrutor oavsett triggers).
  - **Vilopuls (Idle)**: `IDLE_INTERVAL_MS = 5000` (skicka bild var 5.0 sekund när rummet är lugnt och stilla).
  - **Burst-läge (Gasa upp)**: `BURST_INTERVAL_MS = 1500` i 6.0 sekunder (`BURST_DURATION_MS = 6000`).
  - **Triggerkällor för Burst**:
    1. Talarväxling detekterad från Gemini eller lokalt VAD.
    2. Skärmtryck / interaktion i AAC-gränssnittet (anrop via `triggerBurst()`).
    3. Lokal **Pixel-Delta rörelsedetektor** i Canvas: Samplar videobildruta i låg upplösning (t.ex. 64x48 eller 32x24), jämför skillnad i luminans/färg mot föregående sampling (`delta > threshold`), och aktiverar burst-läget automatiskt om något rör sig framför kameran.

### Fråga 3 (Effects & Way Forward - Web Audio Autoplay, PCM16-ljud & Avbrott):
- **Web Audio Autoplay Policy**: I webbläsare krävs en direkt användarinteraktion för att starta eller återuppta en `AudioContext`. Genom att anropa `audioContext.resume()` (eller `pcmPlayer.resume()`) synkront inuti klick-handlern för mikrofonknappen (`onToggleListening` i `UserControlZone` och `toggleListening` i `useAacDisplay`) säkerställs att ljudmotorn tillåts spela upp inkommande PCM16-ljud utan att tystas eller blockeras.
- **Utmönstring av talsyntes**: Lokal `window.speechSynthesis` avlägsnas helt som ljudkälla för Geminis yttranden.
- **PCM16 24kHz avspelning**: Inkommande ljudpaket (`serverContent.modelTurn.parts` med `inlineData`) avkodas från base64 till 16-bitars PCM little-endian (Int16Array) och konverteras till 32-bitars float för avspelning via Web Audio API `AudioContext` vid 24000 Hz samplingsfrekvens.
- **Avbrottshantering (Barge-in / Interruption)**: När servern skickar `serverContent.interrupted === true` anropas `pcmPlayer.interrupt()`, vilket omedelbart avbryter schemalagda källor och nollställer uppspelningsbufferten.

---

## 2. Vektoranalys & Risknoder
- **`Resilience`**: Hårdvaruresurser (kamera + mikrofon), Web Audio Autoplay-policy och adaptiv nätverks-/bildbelastning.

```json
{
  "active_vectors": ["Resilience"],
  "vector_count": 1,
  "execution_mode": "linear",
  "status": "COMPLETED",
  "next_step": "2a_forandra_utat_vision"
}
```
