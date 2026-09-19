# Steg 3a: Helhet, orkestrering och integration (TCK-006C)

## 1. Helhetsarkitektur
Systemet orkestreras av `LiveListenerService` inom `src/features/live_listener/` i samverkan med `useAacDisplay` och `UserControlZone`:
1. **Användarinteraktion & AudioContext Resumption**:
   - När användaren klickar på mikrofonknappen (`onToggleListening` / `toggleListening`) anropas omedelbart och synkront `pcmPlayer.resume()` (vilket exekverar `audioContext.resume()`) för att garantera att ljudmotorn sätts i aktivt tillstånd i enlighet med webbläsarens Autoplay Policy.
2. **Sessionsstart & Samtycke**:
   - Vid aktivering initieras `GeminiLiveSession` mot `models/gemini-3.8-live` via `@google/genai`.
   - Systeminstruktionen injiceras med dynamisk tidsmedvetenhet (aktuell svensk lokal tid, datum och tidsfas som morgon/lunch/fika/kväll).
3. **Kameravision med dynamisk frekvens och Pixel-Delta**:
   - `CameraManager` erhåller `getUserMedia({ video: { width: 640, height: 480 } })`.
   - Endast en aktiv kontrollerad instans tillåts (singleton).
   - **Dynamisk Frekvens**:
     - *Minimitid (Rate Limiter)*: Absolut spärr om 1.0 sekund (`MIN_INTERVAL_MS = 1000`).
     - *Vilopuls (Idle)*: 5.0 sekunder (`IDLE_INTERVAL_MS = 5000`) när omgivningen är stilla.
     - *Burst-läge (Gasa upp)*: 1.5 sekunder (`BURST_INTERVAL_MS = 1500`) i 6 sekunder vid:
       a) Talarväxling.
       b) Skärmtryck i AAC-gränssnittet (`cameraManager.triggerBurst()`).
       c) Rörelse detekterad av intern Pixel-Delta algoritm på Canvas-frame.
   - Vid avstängning anropas `cameraManager.stop()` som omedelbart anropar `track.stop()` på samtliga aktiva videospår och nollställer referensen så att hårdvaruindikatorn släcks.
4. **Ljudinmatning & PCM16-ljuduppspelning**:
   - Mikrofonljud samplas i 16kHz PCM16 mono och strömmas till Gemini som realtime-input.
   - Inkommande audio från Gemini (24kHz PCM16) avkodas och spelas upp via `PcmPlayer` i `AudioContext`.
   - Vid `serverContent.interrupted === true` anropas `pcmPlayer.interrupt()` för omedelbar tystnad.
5. **Symbol- och zonuppdatering**:
   - När Gemini identifierar samtalsämnen uppdateras samtalszonerna via `update_topic_zones` eller transkriberingshändelser i `AacDisplay`.
