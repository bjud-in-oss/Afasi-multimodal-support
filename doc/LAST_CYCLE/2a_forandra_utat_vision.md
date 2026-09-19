# Steg 2a: Förändra utåt (Vision & Yttre Arkitektur) - TCK-006C

## 1. Vision för äkta multimodal Gemini Live i afasigränssnittet
Målet med TCK-006C är att transformera prototypen från en simulerad/hybrid talsyntes till en äkta, levande samtalsassistent som ser, hör och talar med naturlig mänsklig närvaro:
1. **Äkta Gemini 3.8 Live Röst**: Istället för mekanisk robotröst från webbläsaren genererar Gemini nativt talande ljud med PCM16 24kHz-kvalitet. Svaren har naturlig intonation, värme och omedelbar responsivitet.
2. **Visuell Kameranärvaro**: Med en kontrollerad kamera ser modellen omgivningen (t.ex. om det står en kaffekopp på bordet, om någon vinkar, eller om det är ljust/mörkt i rummet), vilket drastiskt ökar relevansen i symbolförslagen utan att användaren behöver förklara med ord.
3. **Respektfull Resurshantering & Integritet**: Webbkameran ska *aldrig* förbli påslagen i smyg. Endast en instans tillåts, och så fort mikrofonen stängs av bryts även kamerans videoström fullständigt och indikatorn släcks.
4. **Tidsmedvetenhet i Nuet**: Genom att kontinuerligt känna till aktuell tid kan assistenten skilja på förmiddagens kaffepaus och kvällens vila, vilket ger kognitivt träffsäkra symboler i rätt sammanhang.

## 2. Arkitektoniska gränssnittsförändringar
- **`src/features/live_listener/domain/`**:
  - `geminiLiveConnection.ts` / `LiveListenerService`: Hanterar WebSockets till `models/gemini-3.8-live` via `@google/genai`.
  - `cameraManager.ts`: Singleton-kontroller för `getUserMedia` med strikt `stop()`-metod som itererar över `stream.getTracks().forEach(t => t.stop())` och nollställer referensen.
  - `pcmPlayer.ts`: Web Audio API `AudioContext` spelare för 24kHz PCM16 med `interrupt()`-funktion.
- **`src/features/live_listener/hooks/useLiveListener.ts`**:
  - Exponerar styrning av mikrofon och kamera i synk samt statusindikatorer för aktiv WebSocket- och kameraström.
