# Steg 3a: Helhet, Orkestrering och Integration (Cykel 10 - TCK-013)

## 1. Systemöversikt & Orkestrering

```
[SpeakerZoneView / AacTileItem]
       │
       │ onSelectTile(tile)
       ▼
[useAacDisplay] ──► messageQueue (max 5)
       │
       ├────────────────────────┐
       ▼                        ▼
[UserControlZone / MessageBar]  [TTS Engine / SpeechSynthesis]
  - Elastisk Flex-skalning         - Privat provlyssning vid klick på symbol
  - Typ A Kryss vid punktval       - Offentlig röst vid Grön Bock
  - Grön Bock [✓ Bekräfta]         
       │                        │
       ▼                        ▼
[LiveListenerService] ◄─────────┘
  - sendTextImpulse(sentence)
       │
       ▼
[Post-Speech Reset] (3000 ms vilsam andningspaus)
  - isBreathingPause = true
  - Timer 3000 ms -> mjuk tömning av messageQueue
```

## 2. Integrationspunkter
1. **`types.ts`**:
   - Utöka `AacDisplayState` med `messageQueue: AacTile[]`, `selectedQueueIndex: number | null`, `isBreathingPause: boolean`.
2. **`useAacDisplay.ts`**:
   - `addToMessageQueue(tile: AacTile)`
   - `removeFromMessageQueue(index: number)`
   - `speakMessageQueue()`: Kör TTS för hela meningen, anropar `defaultLiveListener.sendTextImpulse(sentence)` och aktiverar 3000 ms andningspaus.
   - `clearMessageQueue()`: Nollställer kön och avbryter andningspaus.
3. **`UserControlZone.tsx`**:
   - Tar emot `messageQueue`, `onSelectQueueTile`, `onRemoveQueueTile`, `isBreathingPause`.
   - Renderar budskapsraden med elastisk flexbox-skalning.
