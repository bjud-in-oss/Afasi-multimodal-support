import { useState, useRef, useCallback, useEffect } from "react";

export interface StickyFloorState {
  isUserInteracting: boolean;
  isGracePeriodActive: boolean;
  thinkingPrompt: string | null;
  startInteraction: () => void;
  endInteraction: () => void;
  cancelInteraction: () => void;
  releaseGracePeriod: () => void;
}

const GRACE_PERIOD_MS = 5000;
const HARD_TIMEOUT_MS = 30000;
const THINKING_PROMPT_TEXT = "Kalle tänker... vänta.";

/**
 * useStickyFloor ([RULE-001: STICKY_FLOOR])
 * 
 * Bevarar arbetsminne och eliminerar race-conditions vid motorisk eller språklig tvekan:
 * 1. Pausar inkommande UI-uppdateringar när användaren rör skärmen.
 * 2. Startar en 5000 ms Grace Period vid touchEnd. Ny beröring nollställer timern.
 * 3. Hård timeout på 30s förhindrar permanent låsning vid oavsiktlig beröring.
 * 4. Ett klick på [Rensa/Avbryt] avbryter Grace Period omedelbart.
 * 5. Emitterar thinkingPrompt ("Kalle tänker... vänta.") till laptop-projektionen.
 */
export function useStickyFloor(): StickyFloorState {
  const [isUserInteracting, setIsUserInteracting] = useState<boolean>(false);
  const [isGracePeriodActive, setIsGracePeriodActive] = useState<boolean>(false);
  const [thinkingPrompt, setThinkingPrompt] = useState<string | null>(null);

  const graceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hardTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = useCallback(() => {
    if (graceTimerRef.current) {
      clearTimeout(graceTimerRef.current);
      graceTimerRef.current = null;
    }
    if (hardTimeoutRef.current) {
      clearTimeout(hardTimeoutRef.current);
      hardTimeoutRef.current = null;
    }
  }, []);

  const startInteraction = useCallback(() => {
    // Om Grace Period är aktiv och ny beröring sker, avbryt grace timern
    if (graceTimerRef.current) {
      clearTimeout(graceTimerRef.current);
      graceTimerRef.current = null;
    }
    setIsGracePeriodActive(false);
    setIsUserInteracting(true);
    setThinkingPrompt(THINKING_PROMPT_TEXT);

    // Hård timeout för att förhindra permanent låsning om användaren håller kvar fingret
    if (!hardTimeoutRef.current) {
      hardTimeoutRef.current = setTimeout(() => {
        clearAllTimers();
        setIsUserInteracting(false);
        setIsGracePeriodActive(false);
        setThinkingPrompt(null);
      }, HARD_TIMEOUT_MS);
    }
  }, [clearAllTimers]);

  const endInteraction = useCallback(() => {
    // Starta 5000ms grace period vid touch-end
    if (graceTimerRef.current) {
      clearTimeout(graceTimerRef.current);
    }
    setIsGracePeriodActive(true);
    setIsUserInteracting(true);
    setThinkingPrompt(THINKING_PROMPT_TEXT);

    graceTimerRef.current = setTimeout(() => {
      clearAllTimers();
      setIsUserInteracting(false);
      setIsGracePeriodActive(false);
      setThinkingPrompt(null);
    }, GRACE_PERIOD_MS);
  }, [clearAllTimers]);

  const cancelInteraction = useCallback(() => {
    // Early release vid klick på Rensa/Avbryt
    clearAllTimers();
    setIsUserInteracting(false);
    setIsGracePeriodActive(false);
    setThinkingPrompt(null);
  }, [clearAllTimers]);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return {
    isUserInteracting,
    isGracePeriodActive,
    thinkingPrompt,
    startInteraction,
    endInteraction,
    cancelInteraction,
    releaseGracePeriod: cancelInteraction,
  };
}
