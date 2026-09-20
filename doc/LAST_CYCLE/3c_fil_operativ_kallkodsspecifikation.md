# Steg 3c: Fil-operativ Källkodsspecifikation (Cykel 10 - TCK-013)

## 1. Berörda Filer och Specifika Ändringar

### 1. `src/features/aac_display/domain/types.ts`
- Utöka `AacDisplayState` med:
  - `messageQueue: AacTile[];`
  - `selectedQueueIndex: number | null;`
  - `isBreathingPause: boolean;`

### 2. `src/features/aac_display/hooks/useAacDisplay.ts`
- Initiera tillståndet med `messageQueue: []`, `selectedQueueIndex: null`, `isBreathingPause: false`.
- `handleSelectTile(tile: AacTile)`:
  - Sätter `selectedTile: tile`.
  - Om `state.messageQueue.length < 5`, lägg till `tile` i `messageQueue`.
- `handleSelectQueueTile(index: number)`:
  - Sätter `selectedQueueIndex: index`.
  - Provläser symbolens text privat (`speechSynthesis.speak` med volym 0.5 eller dämpad ton).
- `handleRemoveQueueTile(index: number, e: React.MouseEvent)`:
  - Tar bort elementet vid `index` ur `messageQueue`.
  - Nollställer `selectedQueueIndex: null`.
- `handleConfirm()`:
  - Om `messageQueue.length > 0`:
    - Bygger mening: `const phrase = messageQueue.map(t => t.speechText).join(" ");`
    - Läser upp offentligt med full volym (`volume = 1.0`).
    - Skickar textimpuls till Gemini Live: `defaultLiveListener.sendTextImpulse(phrase)`.
    - Aktiverar `isBreathingPause = true`.
    - Startar en 3000 ms timer som sedan tömmer `messageQueue: []`, nollställer `selectedTile: null` och sätter `isBreathingPause = false`.
  - Om enbart `selectedTile` finns: bekräftar den enligt befintligt beteende.
- `handleClear()`:
  - Tömmer `messageQueue: []`, nollställer `selectedTile: null`, `selectedQueueIndex: null`.
  - Avbryter eventuell aktiv andningspaus-timer.

### 3. `src/features/aac_display/components/UserControlZone.tsx`
- Tar emot `messageQueue: AacTile[]`, `selectedQueueIndex: number | null`, `onSelectQueueTile`, `onRemoveQueueTile`, `isBreathingPause: boolean`.
- Renderar budskapsraden (Message Bar) i den horisontella botten-dockan:
  - Elastisk Flexbox med skala: `w-14` vid 5 brickor upp till `w-20` vid 1–2 brickor.
  - Varje bricka i kön har `data-testid="message-bar-tile-${tile.id}"` (eller index-baserat).
  - Vid `selectedQueueIndex === index` visas ett litet rött Typ A kryss (`data-testid="queue-remove-tile-${index}"`) för att avlägsna just den symbolen.
  - Under andningspaus (`isBreathingPause === true`) visas en mjuk pulserande effekt (`data-testid="breathing-pause-indicator"`).

### 4. `src/features/live_listener/domain/liveListenerService.ts`
- Implementera `sendTextImpulse(text: string): Promise<void>`:
  - Om session är öppen: anropa `session.sendRealtimeInput([{ text }])`.
  - Registrera händelsen i `defaultDiagnosticRecorder`.

### 5. `src/features/aac_display/components/__tests__/AacDisplay.test.tsx`
- TDD-tester för:
  - Lägga till symboler i budskapsraden (upp till max 5).
  - Skalning och flex-visning utan overflow.
  - Punktkorrigering: klick på symbol visar Typ A kryss och raderar symbolen.
  - Bekräfta och offentlig röst: Grön bock läser upp meningen och anropar `sendTextImpulse`.
  - Post-speech reset: 3000 ms andningspaus återställer kön.
