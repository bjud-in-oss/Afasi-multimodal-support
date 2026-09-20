import { AacTile } from "../../aac_display/domain/types";

export type ListenerStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "paused"
  | "awaiting_consent"
  | "error";

export type SpeakerId = string;

export type CameraStatus = "inactive" | "requesting" | "active" | "error";

export interface LiveUtteranceEvent {
  id: string;
  speakerId: SpeakerId;
  text: string;
  tiles: AacTile[];
  timestamp: number;
}

export interface ConsentState {
  requested: boolean;
  granted: boolean;
  timestamp?: number;
}

export interface CameraManagerConfig {
  minIntervalMs?: number;       // Standard: 1000 (Absolut lägsta gräns)
  idleIntervalMs?: number;      // Standard: 5000 (Vilopuls)
  burstIntervalMs?: number;     // Standard: 1500 (Burst-frekvens)
  burstDurationMs?: number;     // Standard: 6000 (Burst varaktighet)
  pixelDeltaThreshold?: number; // Standard: 0.12 (Rörelsetröskel)
}

export interface CameraManagerInterface {
  start(): Promise<MediaStream | null>;
  stop(): void;
  captureFrameJpeg(): string | null;
  triggerBurst(reason?: string): void;
  isBurstActive(): boolean;
  getNextIntervalMs(): number;
  isActive(): boolean;
  getStatus(): CameraStatus;
}

export interface PcmAudioPlayerInterface {
  resume(): Promise<void>;
  enqueuePcmChunk(base64Pcm: string): void;
  interrupt(): void;
  close(): Promise<void>;
  isPlaying(): boolean;
}

export type DayPeriod =
  | "morgon"
  | "förmiddag"
  | "lunch"
  | "fika"
  | "eftermiddag"
  | "middag"
  | "kväll"
  | "natt";

export interface TemporalContext {
  currentTimeIso: string;
  localTimeFormatted: string;
  dayOfWeek: string;
  dayPeriod: DayPeriod;
  summaryDescription: string;
}

export interface ListenerOptions {
  model?: string; // Standard: "models/gemini-3.8-live"
  enableCamera?: boolean;
  enableTimeAwareness?: boolean;
  onUtterance?: (event: LiveUtteranceEvent) => void;
  onStatusChange?: (status: ListenerStatus) => void;
  onCameraStatusChange?: (status: CameraStatus) => void;
  onActiveSpeakerChange?: (speakerId: SpeakerId | null) => void;
  onDiagnosticEvent?: (status: string) => void;
  onDiagnosticStatusChange?: (status: string) => void;
  consentMessage?: string;
}
