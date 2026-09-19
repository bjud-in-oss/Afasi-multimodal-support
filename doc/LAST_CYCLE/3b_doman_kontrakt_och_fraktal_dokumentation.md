# Steg 3b: Domänkontrakt & Fraktal Dokumentation (TCK-006C)

## 1. Typ- och Kontraktspecifikation
```ts
// src/features/live_listener/domain/types.ts

export type CameraStatus = 'inactive' | 'requesting' | 'active' | 'error';

export interface CameraManager {
  start(): Promise<MediaStream | null>;
  stop(): void;
  captureFrameJpeg(): string | null;
  isActive(): boolean;
  getStatus(): CameraStatus;
}

export interface PcmAudioPlayer {
  enqueuePcmChunk(base64Pcm: string): void;
  interrupt(): void;
  close(): void;
  isPlaying(): boolean;
}

export interface TemporalContext {
  currentTimeIso: string;
  localTimeFormatted: string;
  dayOfWeek: string;
  dayPeriod: 'morgon' | 'förmiddag' | 'lunch' | 'eftermiddag' | 'middag' | 'kväll' | 'natt';
  summaryDescription: string;
}

export interface LiveListenerOptions {
  model?: string; // Standard: "models/gemini-3.8-live"
  enableCamera?: boolean; // Standard: true vid samtycke
  enableTimeAwareness?: boolean; // Standard: true
  onUtterance?: (event: LiveUtteranceEvent) => void;
  onActiveSpeakerChange?: (speakerId: SpeakerId | null) => void;
  onStatusChange?: (status: ListenerStatus) => void;
  onCameraStatusChange?: (status: CameraStatus) => void;
  onDiagnosticEvent?: (event: string) => void;
}
```

## 2. Visuella regler och tillgänglighet
- Kamera- och mikrofontillstånd visualiseras med tydliga, lugna ikoner utan störande flimmer.
- När lyssnandet avslutas ska kameran vara bevisligen frikopplad (inga kvarvarande tracks).
- Alla tidsangivelser och kontexter formateras på svenska för att passa användarens hemmiljö.
