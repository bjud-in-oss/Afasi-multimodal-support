export interface LearnedAssociation {
  id: string; // T.ex. "coffee_cake"
  contextKey: string;
  iconKey: string;
  confirmCount: number;
  rejectCount: number;
  calculatedConfidence: number;
  lastUpdated: number;
}

export interface MemoryStorageState {
  version: number;
  associations: Record<string, LearnedAssociation>;
  lastSyncTimestamp: number;
}

export interface FeedbackInput {
  contextKey: string;
  tileId: string;
  iconKey: string;
  action: "confirm" | "reject";
  initialConfidence: number;
}
