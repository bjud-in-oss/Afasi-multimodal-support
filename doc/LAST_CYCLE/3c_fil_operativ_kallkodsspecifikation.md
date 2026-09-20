# Steg 3c: Filoperativ källkodsspecifikation (Cykel 9 - TCK-010-011)

## 1. Filoperativ källkodsspecifikation

### Fil 1: `src/features/aac_display/components/AacDisplay.tsx`
- **Rotytan**:
  Ersätt klasserna på `<main data-testid="aac-display-root">`:
  ```tsx
  className="h-screen max-h-screen overflow-hidden w-full bg-stone-100 flex flex-col lg:flex-row gap-5 p-4 select-none"
  ```
- **Sticky Floor händelselyssnare**:
  Applicera på rotytan:
  ```tsx
  onTouchStart={handleTouchStart}
  onPointerDown={handlePointerDown}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
  onPointerUp={handlePointerUp}
  ```
- **Laptop-projektion indikator**:
  Om `stickyFloor.thinkingPrompt` är aktiv ("Kalle tänker... vänta.") visas en mjukt pulserande ram runt deltagarens profil i laptop-vyn (`[RULE-001]`).

### Fil 2: `src/features/aac_display/components/UserControlZone.tsx`
- **Container**:
  Sätt klasserna:
  ```tsx
  className="w-full lg:w-80 h-full min-h-0 p-5 rounded-3xl border border-stone-300/80 bg-stone-100/90 flex flex-col gap-5 shadow-sm select-none"
  ```
- **Rensning av statiska scenknappar (`[SYSTEM-005]`)**:
  Radera blocket med statiska knappar (`scene-coffee`, `scene-cart`, `scene-heart`, `scene-home`).
- **Elastisk kontrollsektion**:
  Behåll mikrofonaktivering och feedback (Grön bock / Rött kryss). Lägg till Rensa/Avbryt-knapp som triggar Sticky Floor tidig release (`cancelInteraction()`).
- **Diagnostikpanel & Nedladdning av Felsöknings-ZIP (`[SYSTEM-004]`)**:
  I den dolda diagnostikpanelen inkluderas knappen:
  ```tsx
  <button
    type="button"
    data-testid="download-diagnostics-zip"
    onClick={handleDownloadDiagnosticsZip}
    className="w-full py-2 px-3 bg-stone-800 hover:bg-stone-900 text-stone-100 rounded-xl text-xs font-mono flex items-center justify-center gap-2"
  >
    Ladda ned Felsöknings-ZIP (60s)
  </button>
  ```

### Fil 3: `src/features/aac_display/components/SpeakerZoneView.tsx`
- **Container**:
  Sätt klasserna:
  ```tsx
  className={`flex-1 h-full min-h-0 p-5 rounded-3xl border flex flex-col transition-all duration-500 ${themeStyles} ${activePulse}`}
  ```
- Rutnätet för brickor sätts med `flex-1 min-h-0 overflow-hidden grid grid-cols-2 gap-4 place-content-start` så att inga rullningslister genereras.

### Fil 4: `src/features/aac_display/components/AacTileItem.tsx`
- **Förstorad ikonstorlek (`[RULE-003]`)**:
  Ersätt `w-12 h-12` med flexibel fyllnad:
  ```tsx
  const props = { className: "w-20 h-20 sm:w-24 sm:h-24 stroke-[1.75]" };
  ```
  Applicera WCAG AAA-kontrastramar och matta bakgrunder enligt `[RULE-014]`.

### Fil 5: `src/features/aac_display/hooks/useStickyFloor.ts` (Ny fil)
- **Logik**:
  - `isUserInteracting: boolean`
  - `gracePeriodActive: boolean`
  - `5000ms Grace Period`: Startas vid `onPointerUp`/`onTouchEnd`.
  - `30s Hard Timeout`: Återställer automatiskt vid kontinuerlig beröring > 30s.
  - `Early Release`: `cancelInteraction()` släpper golvet omedelbart vid klick på `[Rensa]`.
  - Callback till `liveListenerService` / UI för att pausa inkommande brickor.

### Fil 6: `src/features/live_listener/domain/liveListenerService.ts`
- **Aktivt samtycke**:
  `startListening()` och `confirmConsent()` sätter `this.consent = { granted: true, timestamp: Date.now() }` och kör `activateSession()` direkt.
- **Fail-Fast API-diagnostik**:
  ```typescript
  const key = resolveGeminiApiKey();
  if (!key) {
    this.updateDiagnosticStatus("SAKNAR API-NYCKEL (VITE_GEMINI_API_KEY)");
    this.handleWebSocketError(400, "SAKNAR API-NYCKEL (VITE_GEMINI_API_KEY)");
    return;
  }
  ```
- **System Instruction**:
  ```markdown
  # ROLE & IDENTITY: AAC COGNITIVE OBSERVER AGENT

  You are the silent Cognitive Observer Agent in a real-time Augmentative and Alternative Communication (AAC) system designed for individuals with aphasia and cognitive fatigue. 

  Your sole mission is to silently observe live multimodal input (audio, screen, room camera) and distill the ongoing conversation into 2-3 visual core concepts for the user's AAC display.

  ---

  ## CORE BEHAVIORAL RULES & CONSTRAINTS

  ### 1. SILENT OBSERVER MODE (`[RULE-002]`, `[SYSTEM-009]`)
  - **DO NOT GENERATE SPOKEN AUDIO OR VERBAL RESPONSES** during live listening.
  - You do NOT transcribe word-for-word. You **DISTILL**.
  - Boil down long monologues or background conversation into a maximum of 2–3 high-priority, actionable visual concepts (keywords/symbols).
  - Output your response **ONLY** via non-blocking tool calls (`update_topic_zones`).

  ### 2. MONOLOGUE ANCHORING & FATIGUE CONTROL (`[RULE-010]`)
  - If a participant speaks continuously for > 30 seconds, **LOCK** the active suggestion tiles to 2–3 stable core concepts.
  - Stop tile churn/flicker immediately to prevent cognitive overload.

  ### 3. CAMERA & VISUAL GROUNDING (`[SYSTEM-003]`, `[RULE-017]`)
  - If a user points at an object or if context requires seeing the physical room vs. screen, issue `switch_camera({ target: "FRONT" | "REAR" })`.
  - Translate physical items identified via the camera into immediate AAC topic tiles.

  ### 4. RADICAL SYMMETRY & COLOR DIARIZATION (`[RULE-009]`)
  - Treat all speakers in the room as equal participants.
  - Categorize utterances by participant color/role (e.g., Blue for Anna, Green for Kalle, Orange for remote) when calling update tools.

  ---

  ## SYSTEM INSTRUCTIONS FOR TOOL CALLING

  When updating the display, always construct the JSON payload for `update_topic_zones` according to these strict bounds:

  1. **Max Tiles:** 2 to 5 concept tiles depending on current fatigue setting.
  2. **Tile Format:** Simple, concrete nouns or core communication intents (e.g., "Kaffe", "Vänta", "Håller med", "Hjälp").
  3. **Behavior:** `NON_BLOCKING` (never interrupt the user's touch interaction or input line).

  ---

  ## SYSTEM ERROR & DEGRADATION PROTOCOL (`[ADR-018]`)
  - If API key or network connection fails, fail silently on the main AAC display (Graceful Degradation).
  - Write exact diagnostic strings (e.g., "SAKNAR API-NYCKEL (VITE_GEMINI_API_KEY)") exclusively to the internal diagnostic log stream.
  ```
- **Verktygsdeklaration (`update_topic_zones`)**:
  Exakt JSON-schema deklarerat med `behavior: "NON_BLOCKING"`, `participantId`, `colorZone`, `behavior` och `tiles` (2–5 brickor, `iconKey`, `label`, `confidence`, `svgContent`).
- **LiveConnectConfig**:
  - `inputAudioTranscription: {}`
  - `outputAudioTranscription: {}`
- **Textimpulser**:
  Skickas via `this.liveSession.sendRealtimeInput({ text })`.

### Fil 7: `src/features/live_listener/domain/diagnosticRecorder.ts` (Ny fil)
- **RAM-buffert**:
  - `events`: Array med tidsstämplade händelser (`timestamp`, `type`, `data`) för transkriptioner, verktygsanrop och tidsmedvetenhet (max 60s historik).
  - `pcmAudioBuffer`: Cirkulär buffer med inkommande och utgående ljud.
  - `screenCapture`: Blob/chunk från `getDisplayMedia` om beviljat.
  - `cameraCapture`: Blob/chunk från `getUserMedia` om beviljat.
- **Export**:
  - `exportDiagnosticsZip(): Promise<Blob>`: Bygger ett ZIP-arkiv innehållande `events.json`, `combined_audio.pcm` (eller wav), `screen.webm` och `camera.webm`.

## 2. Teststrategi (Fas 2)
- Enhetstester i `src/features/aac_display/__tests__/stickyFloor.test.ts` och `src/features/live_listener/__tests__/liveListenerService.test.ts`.
- INGA Puppeteer- eller E2E-tester implementeras.
