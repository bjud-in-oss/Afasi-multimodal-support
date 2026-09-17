import { AacTile } from "../../aac_display/domain/types";

export type ListenerStatus = "idle" | "awaiting_consent" | "listening" | "paused";

export type SpeakerId = "speaker-1" | "speaker-2";

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
  consentMessage?: string;
}
