export type ColorTheme = "stone" | "emerald" | "amber" | "sky" | "violet" | "rose";

export interface AacTile {
  id: string;
  iconKey:
    | "coffee"
    | "cake"
    | "water"
    | "cart"
    | "apple"
    | "pill"
    | "heart"
    | "sun"
    | "home"
    | "smile"
    | "help"
    | "thumbs-up"
    | "thumbs-down"
    | "pain"
    | "toilet"
    | "yes"
    | "no";
  confidence: number; // 0.0 - 1.0
  isGroundTruth: boolean;
  speechText: string;
  category?: "food" | "health" | "social" | "need";
}

/**
 * Permanenta trygghetsbrickor vid tystnad eller tomma samtalsämnen [RULE-007]
 * [ Ja ], [ Nej ], [ Ont / Smärta ], [ Toalett ], [ Vatten ]
 */
export const PERMANENT_SAFETY_TILES: AacTile[] = [
  {
    id: "safety-yes",
    iconKey: "thumbs-up",
    confidence: 1.0,
    isGroundTruth: true,
    speechText: "Ja",
    category: "social",
  },
  {
    id: "safety-no",
    iconKey: "thumbs-down",
    confidence: 1.0,
    isGroundTruth: true,
    speechText: "Nej",
    category: "social",
  },
  {
    id: "safety-pain",
    iconKey: "pain",
    confidence: 1.0,
    isGroundTruth: true,
    speechText: "Ont / Smärta",
    category: "health",
  },
  {
    id: "safety-toilet",
    iconKey: "toilet",
    confidence: 1.0,
    isGroundTruth: true,
    speechText: "Toalett",
    category: "need",
  },
  {
    id: "safety-water",
    iconKey: "water",
    confidence: 1.0,
    isGroundTruth: true,
    speechText: "Vatten",
    category: "need",
  },
];

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
  messageQueue: AacTile[];
  selectedQueueIndex: number | null;
  isBreathingPause: boolean;
}
