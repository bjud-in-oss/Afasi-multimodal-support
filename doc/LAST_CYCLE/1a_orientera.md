# Steg 1a: Orientera (Cykel 9 - TCK-010-011: Dynamisk AAC-yta & Gemini Live Protokoll)

## 1. Problembeskrivning & Målbild
Implementera den fullständiga specifikationen i `doc/AAC_COGNITIVE_RULES.md` och koppla samman den kognitiva rullningsfria AAC-ytan med Gemini Live API-protokollet:

1. **Rullningsfri & Elastisk Yta (`[RULE-003]`)**:
   - `AacDisplay.tsx`: Lås rotytan till `h-screen max-h-screen overflow-hidden w-full bg-stone-100 flex flex-col lg:flex-row gap-5 p-4 select-none`.
   - `UserControlZone.tsx` och `SpeakerZoneView.tsx`: Sätt `h-full min-h-0 flex-col` för att eliminera rullningslister och ge elastisk skalning.
   - `AacTileItem.tsx`: Förstora symbolikoner till flexibel fyllnad (`w-20 h-20` / `w-24 h-24`).
   - Radera de statiska övningsknapparna (Fika, Handla, Hälsa) så att alla kategorier och samtalszoner byggs 100 % dynamiskt av AI-agenten (`[SYSTEM-005]`).

2. **Sticky Floor & Laptop-projektion (`[RULE-001]`, `[RULE-009]`, `[RULE-016]`)**:
   - Vid beröring (`onTouchStart`, `onPointerDown`, `touchMove`, drag) pausas alla inkommande bakgrundsuppdateringar (`update_topic_zones`).
   - Starta en 5000 ms Grace Period-timer vid `onTouchEnd`/`onPointerUp`. Ny beröring nollställer timern.
   - Ett klick på `[Rensa]` nollställer budskapsraden och avbryter Grace Period omedelbart.
   - En 30-sekunders hard timeout återupptar bakgrundsuppdateringar vid oavbruten beröring.
   - Skicka status till den delade laptopen som visar pulserande ram med texten `"Kalle tänker... vänta."`.

3. **Gemini Live 3.8 Silent Observer & Protokoll (`[RULE-002]`, `[SYSTEM-001]`, `[SYSTEM-009]`)**:
   - Aktivt samtycke via klick på mikrofonknappen (`consent.granted = true`) och direkt `activateSession()` utan verbal hälsning.
   - `systemInstruction`: Exakt fastställd instruktion för tyst kognitiv observatör som inte pratar högt under lyssning, inte transkriberar ordagrant utan destillerar till 2–3 visuella kärnkoncept, ankrar monologer >30s och hanterar symmetrisk talardiarisering.
   - Verktygsdeklaration: `update_topic_zones` med `behavior: "NON_BLOCKING"`, parametrar för `participantId`, `colorZone`, `behavior` och `tiles` (max 2–5 koncept).
   - `LiveConnectConfig`: `inputAudioTranscription: {}` (16kHz PCM in), `outputAudioTranscription: {}` (24kHz PCM ut).
   - Textimpulser: Skickas uteslutande via `sendRealtimeInput({ text: ... })` enligt `SKILL.md`.

4. **Fail-Fast Diagnostik & 60s RAM-recorder (`[ADR-018]`, `[SYSTEM-004]`)**:
   - Om API-nyckel saknas visas `"SAKNAR API-NYCKEL (VITE_GEMINI_API_KEY)"` i klartext i diagnostikraden.
   - `diagnosticRecorder.ts`: Underhåller en 60s rullande RAM-buffert bestående av tidsstämplade `events.json` (med time-awareness och funktionsanrop), skärmström (`getDisplayMedia`), kameraström (`getUserMedia`) och kombinerat PCM-ljud.
   - Knappen `[Ladda ned Felsöknings-ZIP]` i den dolda diagnostikpanelen (`UserControlZone.tsx`) laddar ned `diagnostics_60s.zip`.

## 2. Inblandade domäner
- `src/features/aac_display/` (Komponenter: `AacDisplay.tsx`, `UserControlZone.tsx`, `SpeakerZoneView.tsx`, `AacTileItem.tsx`, hooks & affärsregler)
- `src/features/live_listener/` (Tjänst: `liveListenerService.ts`, `diagnosticRecorder.ts`, typer & affärsregler)

## 3. Tre fokuserade GROW-frågor mot faktiska risknoder
1. **State & Layout (Sticky Floor & Rullningsfrihet)**: Hur implementeras Sticky Floor (5000ms grace period, 30s hard timeout, tidig release vid Rensa) och rullningsfri CSS (`h-screen overflow-hidden select-none`, `h-full min-h-0 flex-col`, ikoner `w-20`/`w-24`) utan att bryta befintliga gesture handlers eller ge layout-jitter?
2. **Contract & Behavior (Gemini Live Silent Observer & NON_BLOCKING)**: Hur konfigureras `liveListenerService.ts` med den exakta Cognitive Observer `systemInstruction`, `behavior: "NON_BLOCKING"` på `update_topic_zones`, `sendRealtimeInput({ text })` och dubbel transkription utan att modellen genererar oönskat tal i rummet?
3. **Resilience & Diagnostics (Fail Fast & 60s RAM Recorder)**: Hur byggs `diagnosticRecorder.ts` med 60 sekunders cirkulär buffert i minnet (events.json, display, kamera, PCM-ljud) och ZIP-paketering till `diagnostics_60s.zip`, och hur garanteras att `"SAKNAR API-NYCKEL (VITE_GEMINI_API_KEY)"` omedelbart syns i diagnostikraden vid start om nyckel saknas?

```json
{
  "status": "IN_PROGRESS",
  "current_domain": "aac_display",
  "next_step": "1b_kartlagga",
  "ticket_id": "TCK-010",
  "active_skill": "gemini-live-api-dev"
}
```
