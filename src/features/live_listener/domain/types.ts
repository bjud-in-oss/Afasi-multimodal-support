import { AacTile } from "../../aac_display/domain/types";

export type ListenerStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "paused"
  | "awaiting_consent"
  | "error";

export type SpeakerId = string;

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

export interface ListenerOptions {
  onUtterance?: (event: LiveUtteranceEvent) => void;
  onStatusChange?: (status: ListenerStatus) => void;
  onActiveSpeakerChange?: (speakerId: SpeakerId | null) => void;
  onDiagnosticEvent?: (status: string) => void;
  consentMessage?: string;
}
