export type ColorTheme = "stone" | "emerald" | "amber" | "sky";

export interface AacTile {
  id: string;
  iconKey: "coffee" | "cake" | "water" | "cart" | "apple" | "pill" | "heart" | "sun" | "home" | "smile" | "help" | "thumbs-up" | "thumbs-down";
  confidence: number; // 0.0 - 1.0
  isGroundTruth: boolean;
  speechText: string;
  category?: "food" | "health" | "social" | "need";
}

export interface SpeakerZone {
  id: string;
  colorTheme: ColorTheme;
  tiles: AacTile[];
  isActive?: boolean;
}

export interface PracticeScenario {
  id: string;
  scenarioIcon: "coffee" | "cart" | "heart" | "home";
  speechContext: string;
  partnerZones: SpeakerZone[];
}

export interface FeedbackRecord {
  tileId: string;
  action: "confirm" | "reject";
  timestamp: number;
}

export interface AacDisplayState {
  mode: "IDLE" | "LIVE" | "PRACTICE";
  speakerZones: SpeakerZone[];
  activeScenarioId: string | null;
  lastSpokenText: string | null;
  feedbackRecords: FeedbackRecord[];
  isListening: boolean;
  consentGranted: boolean;
}
