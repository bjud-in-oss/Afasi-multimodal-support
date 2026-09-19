# Steg 3b: Domänkontrakt & Fraktal Dokumentation (TCK-006C)

## 1. Typ- och Kontraktspecifikation
```ts
// src/features/live_listener/domain/types.ts

export type CameraStatus = 'inactive' | 'requesting' | 'active' | 'error';

export interface CameraManagerConfig {
  minIntervalMs?: number;    // Standard: 1000 (Absolut lägsta gräns)
  idleIntervalMs?: number;   // Standard: 5000 (Vilopuls)
  burstIntervalMs?: number;  // Standard: 1500 (Burst frekvens)
  burstDurationMs?: number;  // Standard: 6000 (Hur länge burst varar)
  pixelDeltaThreshold?: number; // Standard: 0.12 (Procentuell luminansskillnad för rörelse)
}

export interface CameraManager {
  start(): Promise<MediaStream | null>;
  stop(): void;
  captureFrameJpeg(): string | null;
  triggerBurst(reason?: string): void;
  checkMotionPixelDelta(): boolean;
  getNextIntervalMs(): number;
  isActive(): boolean;
  getStatus(): CameraStatus;
}

export interface PcmAudioPlayer {
  resume(): Promise<void>;
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
- Kamera- och mikrofontillstånd visualiseras med tydliga ikoner.
- Klick-handlern i UI triggar synkront ljudaktivering (`audioContext.resume()`) vilket garanterar att användaren aldrig drabbas av tystnade ljudströmmar.
- När lyssnandet avslutas ska kameran vara bevisligen frikopplad (inga kvarvarande aktiva tracks).
- Alla tidsangivelser och kontexter formateras på svenska för att passa användarens hemmiljö.
