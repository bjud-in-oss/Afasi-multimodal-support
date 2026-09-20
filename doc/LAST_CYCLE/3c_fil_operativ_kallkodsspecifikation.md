# Steg 3c: Filoperativ källkodsspecifikation (Cykel 7 - TCK-008 Reviderad)

## 1. Mål & Krav i Revideringen
1. **Mikrofon-PCM-strömning i `liveListenerService.ts`**:
   - Vid `activateSession()`:
     - Anropa `navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } })`.
     - Skapa en `AudioContext` eller `ScriptProcessorNode`/`AudioWorklet` (eller MediaStreamTrack-lyssnare) för att sampla 16kHz PCM16-mono.
     - Konvertera PCM16 (Int16Array) till Base64.
     - Skicka kontinuerligt över WebSocket via `this.liveSession.sendRealtimeInput({ audio: { data: base64Pcm, mimeType: "audio/pcm;rate=16000" } })`.
     - Logga utgående PCM-paket med `this.logPcmPacket()`.
     - Spara mikrofonström och stoppa alla ljudspår (`track.stop()`) i `stopListening()` och `resetConsent()`.
2. **Direkta svar och funktioner från Gemini**:
   - Gemini svarar med binärt PCM16-ljud (`modelTurn.parts` med `inlineData`) -> spelas upp via `this.pcmPlayer.enqueuePcmChunk(part.inlineData.data)`.
   - Gemini funktionsanrop:
     - Deklarera verktyget `update_topic_zones` i Gemini-sessionens `config.tools` med JSON-schema för talar-ID, ämne och bildbrickor (`tiles: [{ iconKey, speechText, confidence }]`).
     - När `response?.serverContent?.modelTurn?.parts` innehåller `functionCall` med namn `update_topic_zones`:
       - Logga anropet via `this.logFunctionCall("update_topic_zones")`.
       - Tolka argumenten (`speakerId`, `tiles`, `topic`).
       - Avfyra `this.options.onUtterance(event)` så att bildbrickorna skapas på skärmen i realtid.
       - Skicka `sendRealtimeInput` med `functionResponses` tillbaka till Gemini om sessionen är öppen.
3. **Borttagning av tyst speechSynthesis-fallback & Fail Fast (ADR-018)**:
   - Ta bort alla anrop till `window.speechSynthesis` och `SpeechSynthesisUtterance` i `LiveListenerService`.
   - `this.speechSynthesizer` är en tom no-op `() => {}` som standard i produktion.
   - Vid mikrofonfel (`getUserMedia` avvisat): Sätt `updateDiagnosticStatus("MIKROFON-FEL: " + err.message)`.
   - Vid WebSocket-fel: Sätt `updateDiagnosticStatus("WS ERROR: " + code + " - " + message)`.
   - Vid kamerafel: Sätt `updateDiagnosticStatus("KAMERA-FEL: " + err.message)`.
4. **Isolerade enhetstester i `liveListenerService.test.ts`**:
   - Mocka `navigator.mediaDevices.getUserMedia` och `AudioContext` för att verifiera att mikrofonströmmen startas och stoppas.
   - Verifiera att `sendRealtimeInput` anropas med PCM-data vid mikrofonavläsning.
   - Verifiera att `functionCall` för `update_topic_zones` genererar talarhändelser och bildbrickor på skärmen.
   - Verifiera att ingen `speechSynthesis` anropas i produktion.
