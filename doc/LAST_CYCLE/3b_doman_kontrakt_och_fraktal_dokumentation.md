# Steg 3b: Domänkontrakt och fraktal dokumentation (Cykel 9 - TCK-010-011)

## 1. Domänkontrakt

### Domän `aac_display`
- **Sticky Floor Kontrakt**:
  ```typescript
  export interface StickyFloorState {
    isUserInteracting: boolean;
    isGracePeriodActive: boolean;
    thinkingPrompt: string | null; // t.ex. "Kalle tänker... vänta."
  }
  ```
  - `startInteraction()`: Sätter `isUserInteracting = true` och pausar inkommande uppdateringar. Startar 30s hard timeout.
  - `endInteraction()`: Startar 5000ms Grace Period.
  - `cancelInteraction()`: Avbryter grace period och hard timeout omedelbart, sätter `isUserInteracting = false`.

- **Layoutkontrakt**:
  - `AacDisplay`: `h-screen max-h-screen overflow-hidden w-full bg-stone-100 flex flex-col lg:flex-row gap-5 p-4 select-none`.
  - `SpeakerZoneView` & `UserControlZone`: `h-full min-h-0 flex-col`.
  - `AacTileItem`: `w-20 h-20` / `w-24 h-24`.

### Domän `live_listener`
- **Gemini Live 3.8 Observer Kontrakt**:
  - `systemInstruction`: Exakt definierad i specifikationen.
  - `tools`: `update_topic_zones` med `behavior: "NON_BLOCKING"`.
  - `LiveConnectConfig`: `inputAudioTranscription: {}`, `outputAudioTranscription: {}`.
  - `sendRealtimeInput({ text: string })`: Skickar text utan avbrott.
- **Diagnostic Recorder Kontrakt (`DiagnosticRecorder`)**:
  - `logEvent(type: string, payload: any): void`
  - `startRecording(): Promise<void>`
  - `stopRecording(): void`
  - `exportZip(): Promise<Blob>`

## 2. Fraktal dokumentation
- `src/features/aac_display/doc/BUSINESS_RULES.md`: Uppdaterad med regler för Sticky Floor (`[RULE-001]`), Rullningsfrihet (`[RULE-003]`), Elastisk budskapsrad (`[RULE-006]`) och borttagna statiska scenknappar (`[SYSTEM-005]`).
- `src/features/live_listener/doc/BUSINESS_RULES.md`: Uppdaterad med regler för Silent Observer (`[RULE-002]`, `[SYSTEM-009]`), Monologue Anchoring (`[RULE-010]`), Dual Voice (`[RULE-005]`), Fail Fast (`[ADR-018]`) och 60s RAM Diagnostic Recorder (`[SYSTEM-004]`).
- `doc/AAC_COGNITIVE_RULES.md`: Kanonisk moderspecifikation.
