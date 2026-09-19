# Steg 3a: Helhet, orkestrering och integration (TCK-006C)

## 1. Helhetsarkitektur
Systemet orkestreras av `LiveListenerService` inom `src/features/live_listener/`:
1. **Sessionsstart & Samtycke**:
   - Vid godkänt samtycke initieras `GeminiLiveSession` mot `models/gemini-3.8-live` via `@google/genai`.
   - Systeminstruktionen injiceras med dynamisk tidsmedvetenhet (aktuell lokal svensk tid, datum och tidsfas som morgon/lunch/fika/kväll).
2. **Kameravision med exklusiv livscykel**:
   - `CameraManager` erhåller `getUserMedia({ video: { width: 640, height: 480 } })`.
   - Exakt en aktiv ström tillåts (singleton).
   - Bildrutor samplas som JPEG vid kontrollerade intervall (t.ex. 1 fps) och skickas som `session.sendRealtimeInput({ video: { data: jpegBase64, mimeType: 'image/jpeg' } })`.
   - Vid avstängning/pausning anropas `cameraManager.stop()` som omedelbart anropar `track.stop()` på alla videospår och nollställer referensen så att kamerans hårdvaruindikator släcks.
3. **Ljudinmatning & PCM16-ljuduppspelning**:
   - Mikrofonljud samplas i 16kHz PCM16 mono och skickas som `session.sendRealtimeInput({ audio: { data: chunkBase64, mimeType: 'audio/pcm;rate=16000' } })`.
   - Inkommande audio från Gemini (24kHz PCM16) tas emot via `serverContent.modelTurn.parts` och spelas upp via `PcmPlayer` i `AudioContext`.
   - Webbläsarens lokala `speechSynthesis` är helt utmönstrad för Gemini-tal.
   - Om Gemini skickar `serverContent.interrupted === true` avbryter `PcmPlayer.interrupt()` omedelbart alla schemalagda noder.
4. **Symbol- och zonuppdatering**:
   - När Gemini identifierar samtalsämnen och talare anropas funktionen `update_topic_zones` (med `behavior: 'NON_BLOCKING'`) eller transkriberingsevents som uppdaterar zonerna och brickorna i `AacDisplay`.
