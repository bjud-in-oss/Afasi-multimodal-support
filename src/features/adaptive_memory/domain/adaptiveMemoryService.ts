import { LearnedAssociation, MemoryStorageState, FeedbackInput } from "./types";
import { AacTile } from "../../aac_display/domain/types";

export class AdaptiveMemoryService {
  private storageKey: string;
  private state: MemoryStorageState;

  constructor(storageKey = "maggan_aac_memory_v1") {
    this.storageKey = storageKey;
    this.state = this.loadFromStorage();
  }

  private loadFromStorage(): MemoryStorageState {
    const defaultState: MemoryStorageState = {
      version: 1,
      associations: {},
      lastSyncTimestamp: Date.now(),
    };

    if (typeof window === "undefined" || !window.localStorage) {
      return defaultState;
    }

    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return defaultState;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.associations === "object") {
        return parsed as MemoryStorageState;
      }
      return defaultState;
    } catch {
      return defaultState;
    }
  }

  private saveToStorage(): void {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      this.state.lastSyncTimestamp = Date.now();
      window.localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch {
      // Tyst hantering om kvot överskridits eller storage är blockerat
    }
  }

  public getAssociationKey(contextKey: string, iconKey: string): string {
    return `${contextKey}__${iconKey}`;
  }

  public getAssociation(contextKey: string, iconKey: string): LearnedAssociation | undefined {
    const key = this.getAssociationKey(contextKey, iconKey);
    return this.state.associations[key];
  }

  public getAllAssociations(): Record<string, LearnedAssociation> {
    return { ...this.state.associations };
  }

  public recordFeedback(input: FeedbackInput): LearnedAssociation {
    const key = this.getAssociationKey(input.contextKey, input.iconKey);
    const existing = this.state.associations[key];

    let confirmCount = existing ? existing.confirmCount : 0;
    let rejectCount = existing ? existing.rejectCount : 0;
    let baseConf = existing ? existing.calculatedConfidence : input.initialConfidence;

    if (input.action === "confirm") {
      confirmCount += 1;
      // Varje bekräftelse stärker konfidensen mot full visshet
      baseConf = Math.min(1.0, Math.max(0.85, baseConf + 0.2));
    } else {
      rejectCount += 1;
      // Avfärdande sänker konfidensen under tröskeln 0.50 så att den inte föreslås igen
      baseConf = Math.max(0.1, Math.min(0.4, baseConf - 0.35));
    }

    const updated: LearnedAssociation = {
      id: key,
      contextKey: input.contextKey,
      iconKey: input.iconKey,
      confirmCount,
      rejectCount,
      calculatedConfidence: Number(baseConf.toFixed(2)),
      lastUpdated: Date.now(),
    };

    this.state.associations[key] = updated;
    this.saveToStorage();
    return updated;
  }

  public applyLearnedWeights(contextKey: string, tiles: AacTile[]): AacTile[] {
    return tiles
      .map((tile) => {
        const learned = this.getAssociation(contextKey, tile.iconKey);
        if (!learned) return tile;

        return {
          ...tile,
          confidence: learned.calculatedConfidence,
          isGroundTruth: learned.calculatedConfidence >= 0.8 || tile.isGroundTruth,
        };
      })
      .filter((tile) => tile.confidence >= 0.5); // Filtrerar bort alla dämpade alternativ
  }

  public clearMemory(): void {
    this.state = {
      version: 1,
      associations: {},
      lastSyncTimestamp: Date.now(),
    };
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.removeItem(this.storageKey);
      } catch {
        // Fallback
      }
    }
  }

  public reset(): void {
    this.clearMemory();
  }
}

export const defaultAdaptiveMemory = new AdaptiveMemoryService();
