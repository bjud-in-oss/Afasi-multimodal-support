# Steg 3a: Helhet, orkestrering och integration (Cykel 9 - TCK-010-011)

## 1. Systemöversikt & Integrationsflöde

```
[ Användare vidrör skärm ] ---> [ Sticky Floor Hook ] ---> Pausar inkommande UI-uppdateringar
                                                       ---> Startar 5000ms Grace Period
                                                       ---> Emitterar "Kalle tänker... vänta." till Laptop
                                                       ---> Snabb-release vid [Rensa] / 30s hard timeout

[ Mikrofon-klick ] ----------> [ consent.granted = true ] ---> [ activateSession() ]
                                                       ---> Startar 16kHz PCM mikrofon
                                                       ---> Ansluter till Gemini Live 3.8
                                                       ---> initierar 60s RAM DiagnosticRecorder

[ Gemini Live 3.8 ] ---------> [ Observer System Instruction ] (Tyst, destillerar till 2-3 koncept)
                               ---> [ update_topic_zones ] (behavior: "NON_BLOCKING")
                               ---> [ inputAudioTranscription & outputAudioTranscription ]
                               ---> [ Avduplicering & Reaktiv rendering på AacDisplay ]
```

## 2. Orkestrering mellan komponenter och tjänster

1. **`AacDisplay.tsx`**:
   - Rotbehållare: `h-screen max-h-screen overflow-hidden w-full bg-stone-100 flex flex-col lg:flex-row gap-5 p-4 select-none`.
   - Lyssnar på `onTouchStart`, `onPointerDown`, `touchMove` och kopplar mot Sticky Floor-hanteraren.
   - Visar den delade laptop-ramen och talarzonerna.

2. **`UserControlZone.tsx` & `SpeakerZoneView.tsx`**:
   - `h-full min-h-0 flex-col` för att förhindra rullningslister.
   - I `UserControlZone.tsx`: Statiska scenknappar (Fika, Handla, Hälsa) raderas.
   - Integrerar knappen `[Ladda ned Felsöknings-ZIP]` i den dolda diagnostikpanelen (aktiverad via statusprick / 3-finger tryck).

3. **`AacTileItem.tsx`**:
   - Ikoner skalas upp till `w-20 h-20` / `w-24 h-24` med flexibel inpassning och WCAG AAA-kontrastlinjer.

4. **`liveListenerService.ts`**:
   - Skarp konfigurering av Gemini Live med den angivna kognitiva `systemInstruction`.
   - `update_topic_zones` deklareras med `behavior: "NON_BLOCKING"`.
   - `sendRealtimeInput({ text })` för textimpulser.
   - Fail-Fast kontroll: Om varken `VITE_GEMINI_API_KEY` eller `process.env.GEMINI_API_KEY` finns sätts diagnostikraden till `"SAKNAR API-NYCKEL (VITE_GEMINI_API_KEY)"`.

5. **`diagnosticRecorder.ts`**:
   - 60-sekunders cirkulär RAM-buffert för tidsstämplade `events.json`, skärminspelning, kamerainspelning och kombinerat PCM-ljud.
   - Generering av `diagnostics_60s.zip`.
