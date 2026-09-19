# Steg 3c: Fil-operativ källkodsspecifikation (TCK-006C)

## 1. Målfiler för implementering i Fas 2 (Steg 4)
1. `src/features/live_listener/domain/types.ts`:
   - Tillägg av `CameraStatus`, `TemporalContext`, `CameraManager`, `PcmAudioPlayer`.
   - Utökning av `ListenerOptions` med `model` (standard `"models/gemini-3.8-live"`), `enableCamera` och `onCameraStatusChange`.

2. `src/features/live_listener/domain/cameraManager.ts` (Ny modul):
   - Singleton-hanterare för `navigator.mediaDevices.getUserMedia({ video: true })`.
   - Metod `captureFrameJpeg()` för att hämta base64-kodad JPEG vid behov/intervall.
   - Metod `stop()` som anropar `track.stop()` på samtliga aktiva videospår i `MediaStream`, nollställer referensen och sätter status till `inactive`.

3. `src/features/live_listener/domain/pcmPlayer.ts` (Ny modul):
   - Web Audio API `AudioContext` vid 24000 Hz.
   - Konvertering av inkommande base64 PCM16-chunks (little-endian) till Float32Array och linjär schemaläggning via `AudioBufferSourceNode`.
   - Metod `interrupt()` som omedelbart stoppar pågående källor och nollställer uppspelningsbufferten vid `serverContent.interrupted`.

4. `src/features/live_listener/domain/temporalContext.ts` (Ny modul):
   - Funktioner för att härleda svensk tidsangivelse, veckodag och dygnsperiod (`morgon`, `lunch`, `fika`, `kväll` etc.).
   - Generering av systeminstruktionsfragment som förankrar modellen i realtid.

5. `src/features/live_listener/domain/liveListenerService.ts`:
   - Integration med `models/gemini-3.8-live` över WebSockets via `@google/genai` `ai.live.connect`.
   - Livscykelkoppling: `stopListening()` och `pauseListening()` anropar alltid `cameraManager.stop()` så att kameran stängs av synkront med mikrofonen.
   - Ersättning av lokal `speechSynthesis`: inkommande modell-audio skickas direkt till `pcmPlayer.enqueuePcmChunk()`.
   - Inkoppling av tidsmedvetenhet vid initiering av session.

6. `src/features/live_listener/hooks/useLiveListener.ts`:
   - Exponera `cameraStatus`, samt garantera full resursfrigöring i unmount-effekt.

7. `src/features/live_listener/__tests__/liveListenerService.test.ts` & `cameraManager.test.ts`:
   - Enhetstester med aktiva interaktionspåståenden:
     - Verifiera att alla videospår anropas med `stop()` vid `stopListening()`.
     - Verifiera att modellen som konfigureras är `models/gemini-3.8-live`.
     - Verifiera att inkommande PCM-paket hanteras av `pcmPlayer` och att `speechSynthesis` inte anropas vid modell-tal.
     - Verifiera att tidsorientering injiceras i systemkontexten.
