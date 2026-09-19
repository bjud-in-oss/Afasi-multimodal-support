# Steg 2a: Förändra utåt (Vision & Yttre Arkitektur) - TCK-006C

## 1. Vision för äkta multimodal Gemini Live i afasigränssnittet
Målet med TCK-006C är att transformera prototypen från en simulerad/hybrid talsyntes till en äkta, levande samtalsassistent som ser, hör och talar med naturlig mänsklig närvaro:
1. **Äkta Gemini 3.8 Live Röst**: Istället för mekanisk robotröst från webbläsaren genererar Gemini nativt talande ljud med PCM16 24kHz-kvalitet. Svaren har naturlig intonation, värme och omedelbar responsivitet.
2. **Visuell Kameranärvaro med Dynamisk Frekvens**:
   - Med en kontrollerad kamera ser modellen omgivningen (t.ex. om det står en kaffekopp på bordet, om någon vinkar, eller om det är ljust/mörkt i rummet), vilket drastiskt ökar relevansen i symbolförslagen utan att användaren behöver förklara med ord.
   - Bildflödet är intelligent och resurssnålt: det vilar på 5.0 s intervall när rummet är stilla, men gasar automatiskt upp till 1.5 s i 6 sekunder vid aktivitet, talarväxling, skärminteraktion eller rörelse i rummet (via Pixel-Delta). En hård rate limit förhindrar någonsin bildsändning oftare än 1.0 s.
3. **Respektfull Resurshantering & Integritet**: Webbkameran ska *aldrig* förbli påslagen i smyg. Endast en kontrollerad singleton-instans tillåts, och så fort mikrofonen stängs av bryts även kamerans videoström fullständigt (`track.stop()`) och indikatorn släcks.
4. **Sömlös Ljuduppspelning via Autoplay-kompatibilitet**: Genom att trigga `audioContext.resume()` direkt i användarens klick på mikrofonknappen elimineras alla webbläsartystnader.
5. **Tidsmedvetenhet i Nuet**: Genom att kontinuerligt känna till aktuell svensk tid kan assistenten skilja på förmiddagens kaffepaus och kvällens vila, vilket ger kognitivt träffsäkra symboler i rätt sammanhang.

## 2. Arkitektoniska gränssnittsförändringar
- **`src/features/live_listener/domain/`**:
  - `geminiLiveConnection.ts` / `LiveListenerService`: Hanterar WebSockets till `models/gemini-3.8-live` via `@google/genai`.
  - `cameraManager.ts`: Singleton-kontroller för `getUserMedia` med strikt `stop()`-metod som itererar över `stream.getTracks().forEach(t => t.stop())`, dynamisk frekvensmotor (5.0s idle, 1.5s burst, 1.0s limit) samt inbyggd Pixel-Delta canvas-detektor.
  - `pcmPlayer.ts`: Web Audio API `AudioContext` spelare för 24kHz PCM16 med `resume()` och `interrupt()`-funktion.
  - `temporalContext.ts`: Formaterare för svensk tid, veckodag och dygnsperiod.
- **`src/features/aac_display/components/UserControlZone.tsx` & `hooks/useAacDisplay.ts`**:
  - Anropar `audioContext.resume()` / `pcmPlayer.resume()` synkront i klick-handlern för mikrofonknappen.
