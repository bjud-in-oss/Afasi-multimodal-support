# Steg 1b: Kartlägga (Cykel 10 - TCK-013: Budskapsrad, Offentlig Röst & Andningspaus)

## 1. Svar på de tre GROW-frågorna

### Svar 1 (State & Flex-skalning)
- `messageQueue: AacTile[]` läggs till i `AacDisplayState` och hanteras i `useAacDisplay.ts`.
- `addTileToMessageQueue(tile: AacTile)`: Om `messageQueue.length < 5`, lägg till `tile`. Max 5 symboler garanterar kognitiv överblick enligt `[RULE-006]`.
- I `UserControlZone.tsx` (eller dedikerad `MessageBar`-sektion i kontrollzonen) renderas brickorna i en horisontell flex-container med `flex-shrink`.
- Skalningsklasser beroende på antal:
  - 1–2 symboler: `w-20 h-20 sm:w-24 sm:h-24`
  - 3–4 symboler: `w-16 h-16 sm:w-20 sm:h-20`
  - 5 symboler: `w-14 h-14 sm:w-16 sm:h-16`
- Detta garanterar att hela meningen ryms i den horisontella bottenraden utan rullningslister (`[RULE-003]`).

### Svar 2 (Contract & TTS-separation)
- **Privat provläsning (`[RULE-005]`, `[RULE-015]`)**:
  - Vid klick på en symbol inuti `messageQueue` markeras den med `selectedQueueIndex`.
  - Ordet provläses via Web Speech API (`window.speechSynthesis.speak`) med låg volym (`volume = 0.5`) eller kontrollerad syntetiserare utan att skicka impuls till Gemini Live.
  - Ett litet rött Typ A kryss (`[x]`) visas över den klickade symbolen. Klick på krysset anropar `removeTileFromMessageQueue(index)`.
- **Offentlig röst (`[RULE-005]`, `[SYSTEM-001]`)**:
  - Vid klick på Gröna Bocken (`handleConfirm` eller `speakMessageQueue`):
    - Hela meningen sammanfogas: `const sentence = messageQueue.map(t => t.speechText).join(" ");`.
    - Den läses upp högt (`volume = 1.0`).
    - Hela texten skickas tyst till Gemini Live via `defaultLiveListener.sendTextImpulse(sentence)`.
    - Detta triggar även adaptiv minnesförstärkning för de ingående symbolerna.

### Svar 3 (Resilience & Timing: Post-Speech Reset)
- Efter uppläsning sätts `isBreathingPause = true` (`[RULE-008]`).
- En timer på 3000 ms startas via `setTimeout`.
- Skärmen och budskapsraden visar en vilsam, dämpad andningspuls (`opacity-70`, `duration-1000`).
- Efter 3000 ms nollställs `messageQueue: []`, `selectedTile: null`, `selectedQueueIndex: null` och `isBreathingPause = false`.
- Vid klick på `[Rensa]` avbryts eventuell pågående timer omedelbart och tillståndet rensas direkt.
- Timern städas i hookens cleanup-funktion vid unmount.

## 2. Vektorvalidering & Fast-Track

```json
{
  "active_vectors": ["State"],
  "linear_fast_track": true,
  "rationale": "Ändringen centrerar kring tillståndsmassan för messageQueue, presentationell flex-skalning och lokal TTS-orkestrering under en domän."
}
```
