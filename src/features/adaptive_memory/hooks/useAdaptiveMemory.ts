import { useState, useCallback } from "react";
import { defaultAdaptiveMemory, AdaptiveMemoryService } from "../domain/adaptiveMemoryService";
import { FeedbackInput } from "../domain/types";
import { AacTile } from "../../aac_display/domain/types";

export function useAdaptiveMemory(service: AdaptiveMemoryService = defaultAdaptiveMemory) {
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  const recordFeedback = useCallback(
    (input: FeedbackInput) => {
      const updated = service.recordFeedback(input);
      setLastUpdated(Date.now());
      return updated;
    },
    [service]
  );

  const applyLearnedWeights = useCallback(
    (contextKey: string, tiles: AacTile[]) => {
      return service.applyLearnedWeights(contextKey, tiles);
    },
    [service]
  );

  return {
    recordFeedback,
    applyLearnedWeights,
    lastUpdated,
  };
}
