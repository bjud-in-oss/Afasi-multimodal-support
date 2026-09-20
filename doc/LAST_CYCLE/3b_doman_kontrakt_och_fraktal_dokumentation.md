# Steg 3b: Domän, Kontrakt och Fraktal Dokumentation (Cykel 10 - TCK-013)

## 1. Domänkontrakt

### AacDisplayState
```typescript
export interface AacDisplayState {
  mode: "IDLE" | "LIVE" | "PRACTICE";
  speakerZones: SpeakerZone[];
  activeScenarioId: string | null;
  lastSpokenText: string | null;
  feedbackRecords: FeedbackRecord[];
  isListening: boolean;
  consentGranted: boolean;
  // Nya kontrakt för TCK-013 (Budskapsrad & Andningspaus):
  messageQueue: AacTile[];
  selectedQueueIndex: number | null;
  isBreathingPause: boolean;
}
```

### useAacDisplay Hook Kontrakt
```typescript
export interface UseAacDisplayReturn {
  state: AacDisplayState;
  selectedTile: AacTile | null;
  feedbackStatus: "confirmed" | "rejected" | null;
  connectionStatus: "disconnected" | "connecting" | "active";
  lastEventStatus: string;
  isUserInteracting: boolean;
  messageQueue: AacTile[];
  isBreathingPause: boolean;
  selectedQueueIndex: number | null;
  handleSelectTile: (tile: AacTile) => void;
  handleConfirm: () => void;
  handleReject: () => void;
  handleClear: () => void;
  toggleListening: () => Promise<void>;
  selectScenario: (key: "coffee" | "cart" | "heart" | "home") => void;
  // Nya metoder:
  handleSelectQueueTile: (index: number) => void;
  handleRemoveQueueTile: (index: number, e: React.MouseEvent) => void;
  handleSpeakMessageQueue: () => void;
}
```

### LiveListenerService Impuls-kontrakt
```typescript
sendTextImpulse(text: string): Promise<void>;
```
Om WebSocket-sessionen är aktiv (`session`) skickas textimpulsen via `sendRealtimeInput({ text })`. I annat fall loggas den tyst i diagnostikströmmen utan att kasta fel.
