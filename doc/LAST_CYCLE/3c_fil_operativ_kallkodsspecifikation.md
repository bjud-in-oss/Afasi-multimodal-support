# Steg 3c: Fil-operativ Källkodsspecifikation (TCK-015)

## Filer och planerade källkodsändringar för Fas 2

### 1. `src/features/aac_display/hooks/useAacDisplay.ts`
- **Ändring i `handleSelectTile`**:
  Kontrollera sista elementet i `prev.messageQueue`:
  ```ts
  const lastTile = prev.messageQueue[prev.messageQueue.length - 1];
  const isAdjacentDuplicate =
    lastTile &&
    (lastTile.id === tile.id ||
      (lastTile.iconKey === tile.iconKey &&
        lastTile.speechText.trim().toLowerCase() === tile.speechText.trim().toLowerCase()));

  const nextQueue =
    isAdjacentDuplicate || prev.messageQueue.length >= 5
      ? prev.messageQueue
      : [...prev.messageQueue, tile];
  ```
- **Ändring i `speakText`**:
  Koppla `utterance.onstart = () => defaultLiveListener.setLocalSpeaking(true);` och `utterance.onend / onerror = () => defaultLiveListener.setLocalSpeaking(false);`.

### 2. `src/features/aac_display/components/UserControlZone.tsx`
- **Ändring**:
  - Ersätt fasta `max-h-24 sm:max-h-28` med flexibel och pekvänlig höjd: `min-h-[4.5rem] sm:min-h-[5rem] lg:min-h-0 h-auto`.
  - Lägg till safe area-padding: `pb-[max(0.75rem,env(safe-area-inset-bottom))]`.
  - Säkra knapparna med `shrink-0` och `min-w-[3rem] sm:min-w-[3.5rem]`.
  - Ge `MessageBar`-containern `shrink min-w-0 overflow-x-auto`.

### 3. `src/features/aac_display/components/MessageBar.tsx`
- **Ändring**:
  - Säkra containern med `shrink min-w-0 max-w-full overflow-x-auto select-none gap-1.5 sm:gap-2 px-1 scrollbar-none`.
  - Säkra brickstorlekarna så att de aldrig kollapsar.

### 4. `src/features/live_listener/domain/liveListenerService.ts`
- **Ändring**:
  - Lägg till `private isLocalSpeaking: boolean = false;`.
  - Implementera `public setLocalSpeaking(speaking: boolean): void`.
  - Implementera `public isPlaybackActive(): boolean { return this.isLocalSpeaking || this.pcmPlayer.isPlaying(); }`.
  - I `processor.onaudioprocess`:
    ```ts
    if (this.status !== "listening") return;
    if (this.isPlaybackActive()) {
      return;
    }
    ```
  - I `COGNITIVE_OBSERVER_INSTRUCTION`:
    Under "1. SILENT OBSERVER MODE", formulera undantaget för `text_impulse`:
    ```markdown
    - **DO NOT GENERATE SPOKEN AUDIO OR VERBAL RESPONSES** during passive background listening.
    - **EXCEPTION FOR DIRECT COMMUNICATION:** When you receive a direct user communicative message via \`text_impulse\`, you MAY generate a single, short, warm, and supportive spoken Swedish response (maximum 1 sentence) to acknowledge or reply to the user. Immediately afterwards, return to silent observer mode.
    ```

### 5. TDD Enhetstester inför Fas 2
- `src/features/aac_display/__tests__/AacDisplay.test.tsx` (eller `useAacDisplay.test.ts`):
  - Testa att `handleSelectTile` med samma bricka två gånger i följd inte lägger till dubbletten i `messageQueue`.
  - Testa att olika brickor kan läggas till upp till max 5 stycken.
- `src/features/live_listener/__tests__/liveListenerService.test.ts`:
  - Testa att `isPlaybackActive()` returnerar `true` när `setLocalSpeaking(true)` anropats eller när `pcmPlayer.isPlaying()` är `true`.
  - Testa att `onaudioprocess` inte skickar PCM-data eller anropar `recordPcmChunk` när `isPlaybackActive()` är `true`.

BESLUT: GODKÄND
