# Steg 3c: Fil-operativ källkodsspecifikation (TCK-006C)

## 1. Målfiler för implementering i Fas 2 (Steg 4)

1. `src/features/live_listener/domain/types.ts`:
   - Tillägg av `CameraStatus`, `CameraManagerConfig`, `CameraManager`, `PcmAudioPlayer`, `TemporalContext`.
   - Utökning av `LiveListenerOptions` med `model` (standard `"models/gemini-3.8-live"`), `enableCamera` och `onCameraStatusChange`.

2. `src/features/live_listener/domain/cameraManager.ts` (Ny modul):
   - **Singleton-hanterare**: Exklusiv instans för `navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })`.
   - **Strikt avstängning (`stop`)**: Itererar över `stream.getTracks().forEach(t => t.stop())`, nollställer referensen till `null` och släcker kameran.
   - **Dynamisk frekvensreglering**:
     - `MIN_INTERVAL_MS = 1000`: Absolut lägsta gräns var 1.0 sekund mellan bildrutor. Om en trigger anländer tidigare spärrar rate limitern.
     - `IDLE_INTERVAL_MS = 5000`: Vilopuls. Skickar bild var 5.0 sekund vid stationärt tillstånd.
     - `BURST_INTERVAL_MS = 1500`: Frekvens sätts till var 1.5 sekund i 6 sekunder (`BURST_DURATION_MS = 6000`).
     - Metod `triggerBurst(reason)`: Aktiverar burst-fönstret vid talarväxling, skärmtryck eller extern händelse.
     - **Pixel-Delta rörelsedetektor**: Renderar aktuell videobildruta till en lågupplöst off-screen canvas (t.ex. 64x48), beräknar den genomsnittliga skillnaden i pixelvärden mot föregående sampling, och aktiverar automatiskt burst-läget om delta överstiger tröskelvärdet (`delta > 0.12`).

3. `src/features/live_listener/domain/pcmPlayer.ts` (Ny modul):
   - Web Audio API `AudioContext` vid 24000 Hz.
   - Metod `resume()`: Utför `audioContext.resume()` för att tillfredsställa webbläsarens Autoplay Policy.
   - Konvertering av inkommande base64 PCM16-chunks (little-endian) till Float32Array och linjär schemaläggning via `AudioBufferSourceNode`.
   - Metod `interrupt()`: Omedelbart stopp av schemalagda källor och nollställning av uppspelningskön vid `serverContent.interrupted`.

4. `src/features/live_listener/domain/temporalContext.ts` (Ny modul):
   - Härledning av svensk tidsangivelse, datum, veckodag och dygnsperiod (`morgon`, `förmiddag`, `lunch`, `eftermiddag`, `middag`, `kväll`, `natt`).
   - Formaterar tidsmedvetet systeminstruktionsfragment för Gemini Live.

5. `src/features/live_listener/domain/liveListenerService.ts`:
   - Anslutning mot `models/gemini-3.8-live` via `@google/genai` `ai.live.connect`.
   - Synkron nedstängning: `stopListening()` och `pauseListening()` anropar alltid `cameraManager.stop()`.
   - Strömning av bilder styrd av kameramotorns dynamiska schema (`getNextIntervalMs()` med hänsyn till idle, burst och rate limiter).
   - Talarväxling triggar automatiskt `cameraManager.triggerBurst('speaker_turn')`.
   - Exponerar `resumeAudio()` som anropar `pcmPlayer.resume()`.

6. `src/features/aac_display/components/UserControlZone.tsx` & `src/features/aac_display/hooks/useAacDisplay.ts`:
   - Klick-handlern för mikrofonknappen anropar synkront `audioContext.resume()` (via `liveListener.resumeAudio()` / `defaultLiveListener.resumeAudio()`) innan övrig asynkron logik startar.
   - Skärmtryck på scen-brickor och feedback-knappar triggar `defaultLiveListener.triggerCameraBurst('touch_interaction')`.

7. `src/features/live_listener/__tests__/liveListenerService.test.ts` & `cameraManager.test.ts`:
   - Enhetstester med aktiva interaktionspåståenden:
     - Verifiera att `track.stop()` anropas för alla videospår vid mikrofonavstängning.
     - Verifiera rate limit (aldrig tätare än 1.0 s mellan frames).
     - Verifiera växling mellan 5.0 s (idle) och 1.5 s (burst) vid `triggerBurst()` eller Pixel-Delta skillnad.
     - Verifiera att `resume()` anropas på AudioContext vid klick-aktivering.
     - Verifiera att modellen som initieras är `models/gemini-3.8-live`.
