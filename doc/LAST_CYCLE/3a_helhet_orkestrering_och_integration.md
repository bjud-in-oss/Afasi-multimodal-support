# Steg 3a: Helhet, orkestrering och integration (Cykel 8 - TCK-008B)

## 1. Systemorkestrering & Integrationskedja

1. **Aktiveringsflöde (Manuellt klick)**:
   - Användaren klickar på mikrofonknappen.
   - `startListening()` eller `confirmConsent()` anropas.
   - `consent.granted` sätts omedelbart till `true`.
   - `activateSession()` körs utan fördröjning:
     - `initLiveWebSocket()` körs.
     - `startMicrophoneStream()` körs (16kHz PCM16-mono).
     - Kameran startas om den är aktiverad.

2. **Gemini 3.8 Live WebSocket-integration (`gemini-live-api-dev/SKILL.md`)**:
   - **Anslutning**:
     ```typescript
     const session = await ai.live.connect({
       model: this.getModel(), // "gemini-3.8-live"
       config: {
         responseModalities: ["audio"],
         systemInstruction: { parts: [{ text: this.getTemporalInstructionFragment() }] },
         inputAudioTranscription: {},
         outputAudioTranscription: {},
         tools: [
           {
             functionDeclarations: [
               {
                 name: "update_topic_zones",
                 description: "Skapar eller uppdaterar AAC-bildbrickor på skärmen baserat på vad samtalspartnern säger.",
                 behavior: "NON_BLOCKING", // Gemini 3.8 krav för asynkron körning
                 parameters: { ... }
               }
             ]
           }
         ]
       },
       callbacks: {
         onopen: () => { ... },
         onmessage: (response) => { ... },
         onerror: (err) => { ... },
         onclose: (event) => { ... }
       }
     });
     ```
   - **Ljud**:
     - Utgående mikrofon skickas via `sendRealtimeInput({ audio: { data: base64Pcm, mimeType: "audio/pcm;rate=16000" } })`.
     - Inkommande tal spelas upp via `pcmPlayer.enqueuePcmChunk(data)`.
   - **Textimpulser**:
     - Skickas alltid via `sendRealtimeInput({ text: ... })` (ej `sendClientContent` med `turnComplete: true`).
   - **Transkriberad text & funktionsanrop**:
     - Fångas upp via `response.serverContent?.inputTranscription?.text`, `response.serverContent?.outputTranscription?.text` och `part.text`.
     - Fångas upp via `part.functionCall` eller `response.toolCall?.functionCalls`.
   - **Central avduplicering**:
     - Båda källorna anropar `emitUtteranceWithDeduplication(speakerId, text, tiles)`.
     - Symboler som visats inom 4000ms filtreras bort så att inga dubletter skapas på skärmen.
     - `options.onUtterance(event)` uppdaterar UI:t med de unika brickorna.
     - För funktionsanrop returneras `toolResponse` med `functionResponses` via `sendRealtimeInput` eller `sendToolResponse`.

3. **Diagnostik & Felrapportering**:
   - Om nyckel saknas rapporteras `"SAKNAR API-NYCKEL (VITE_GEMINI_API_KEY)"` direkt till `updateDiagnosticStatus`.
