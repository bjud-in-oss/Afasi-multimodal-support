# Steg 1b: Kartlägga (Cykel 9 - TCK-010-011: Dynamisk AAC-yta & Gemini Live Protokoll)

## 1. Besvarande av GROW-frågorna

### Svar på Fråga 1 (State & Layout: Sticky Floor & Rullningsfrihet)
- **Rullningsfri rotyta & zoner**:
  - I `AacDisplay.tsx` sätts rotytan till `h-screen max-h-screen overflow-hidden w-full bg-stone-100 flex flex-col lg:flex-row gap-5 p-4 select-none`.
  - I `UserControlZone.tsx` och `SpeakerZoneView.tsx` sätts `h-full min-h-0 flex-col` för att garantera att behållarna skalar internt med flexbox istället för att skapa vertikala eller horisontella rullningslister.
  - I `AacTileItem.tsx` uppdateras ikonstorlekarna från fasta `w-12 h-12` till flexibel fyllnad `w-20 h-20` (på mindre skärmar) och `w-24 h-24` (på större skärmar).
  - Statiska scenknappar (Fika, Handla, Hälsa) i `UserControlZone.tsx` raderas. Ytan dedikeras helt till dynamiska zoner och elastiska kontroller (`[SYSTEM-005]`).
- **Sticky Floor-logik (`[RULE-001]`)**:
  - Inför ett nytt tillstånd `isUserInteracting` i `useAacDisplay` / `AacDisplay`.
  - Händelselyssnare på touch/pointer (`onTouchStart`, `onPointerDown`, `touchMove`): Sätter omedelbart `isUserInteracting = true` och pausar appliceringen av inkommande `update_topic_zones`.
  - Vid `onTouchEnd` / `onPointerUp`: Starta en 5000 ms Grace Period-timer (`gracePeriodTimeoutRef`). Om ny beröring sker innan timern löpt ut återställs timern.
  - Hård timeout (`hardTimeoutRef`): Om beröring pågår oavbrutet i > 30 000 ms återställs `isUserInteracting = false` automatiskt.
  - Tidig release: När användaren klickar på `[Rensa]` (eller avfärdar vald bricka/mening) avbryts grace-timern direkt och `isUserInteracting = false`.
  - Laptop-indikator: En visuell status-puls ("Kalle tänker... vänta.") emitteras och visas på den delade laptop-vyn via `onUserThinkingChange`.

### Svar på Fråga 2 (Contract & Behavior: Gemini Live Silent Observer & NON_BLOCKING)
- **System Instruction**:
  I `liveListenerService.ts` konfigureras `systemInstruction` exakt enligt specifikationen:
  ```markdown
  # ROLE & IDENTITY: AAC COGNITIVE OBSERVER AGENT
  You are the silent Cognitive Observer Agent in a real-time Augmentative and Alternative Communication (AAC) system designed for individuals with aphasia and cognitive fatigue. 
  Your sole mission is to silently observe live multimodal input (audio, screen, room camera) and distill the ongoing conversation into 2-3 visual core concepts for the user's AAC display.
  ...
  ```
- **Verktygsdeklaration**:
  Verktyget `update_topic_zones` deklareras med det exakta JSON-schemat:
  ```typescript
  {
    name: "update_topic_zones",
    description: "Tyst och icke-blockerande uppdatering av AAC-skärmens bildbrickor och samtalszoner. Destillerar pågående samtal till 2–5 kärnbegrepp.",
    behavior: "NON_BLOCKING",
    parameters: {
      type: "OBJECT",
      properties: {
        participantId: { type: "STRING", description: "Unikt ID eller namn för deltagaren som talar (t.ex. 'Kalle', 'Anna', 'p1')." },
        colorZone: { type: "STRING", description: "Färgzon för diarisering på den delade laptopen [RULE-009].", enum: ["blue", "green", "orange", "purple"] },
        behavior: { type: "STRING", description: "Garanterar icke-blockerande gränssnittsbeteende [RULE-002].", enum: ["NON_BLOCKING"] },
        tiles: {
          type: "ARRAY",
          description: "Lista med 2–5 destillerade bildbrickor/kärnbegrepp [SYSTEM-009].",
          items: {
            type: "OBJECT",
            properties: {
              iconKey: { type: "STRING", description: "Unik söknyckel för ikonen (t.ex. 'coffee', 'wait', 'agree', 'help')." },
              label: { type: "STRING", description: "Kort textetikett som visas på bildbrickan (t.ex. 'Kaffe', 'Vänta', 'Håller med')." },
              confidence: { type: "NUMBER", description: "Konfidensgrad för prediktionen (0.0 - 1.0) för adaptiv dämpning." },
              svgContent: { type: "STRING", description: "(Tier 3 Bildmotor) Direktkodad högkontrast-SVG vid unika/komplexa begrepp som saknas i lokal cache [ADR-023]." }
            },
            required: ["iconKey", "label"]
          }
        }
      },
      required: ["participantId", "tiles", "behavior"]
    }
  }
  ```
- **Transkription & Textimpulser**:
  - `inputAudioTranscription: {}` och `outputAudioTranscription: {}` aktiveras.
  - Text skickas uteslutande via `sendRealtimeInput({ text })` i enlighet med `SKILL.md`.

### Svar på Fråga 3 (Resilience & Diagnostics: Fail Fast & 60s RAM Recorder)
- **Fail-Fast API-diagnostik**:
  - Vid initiering av `initLiveWebSocket()` kontrolleras `VITE_GEMINI_API_KEY` och `process.env.GEMINI_API_KEY`.
  - Om nyckel saknas sätts diagnostikraden omedelbart till `"SAKNAR API-NYCKEL (VITE_GEMINI_API_KEY)"` i klartext via `updateDiagnosticStatus`.
- **Diagnostic Recorder (`diagnosticRecorder.ts`)**:
  - Underhåller en 60 sekunders rullande RAM-buffert:
    1. `events.json`: Loggar tidsstämplade transkriptioner, tidsmedvetenhet och `update_topic_zones` verktygsanrop.
    2. `screenStream`: Samplar `getDisplayMedia` vid aktivering.
    3. `cameraStream`: Samplar `getUserMedia` vid aktivering.
    4. Kombinerat ljudspår: Ljud från mikrofon in och Gemini Live PCM ut.
  - Exporterar `diagnostics_60s.zip` med JSZip eller ren Blob/ZIP-struktur som laddas ned via `[Ladda ned Felsöknings-ZIP]` i `UserControlZone.tsx`.

## 2. Aktiva vektorer & Vägval
Förändringen leds av tillstånd och layoutstyrning. Vektor sätts till `State` ($V = 1 < 2$), vilket aktiverar linjärt snabbspår.

```json
{
  "active_vectors": ["State"],
  "mode": "linear",
  "ticket_id": "TCK-010",
  "next_step": "2a_forandra_utat_vision"
}
```
