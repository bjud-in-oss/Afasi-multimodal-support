import { useState, useCallback } from "react";
import { AacTile, PracticeScenario, FeedbackRecord, AacDisplayState } from "../domain/types";
import { defaultAdaptiveMemory } from "../../adaptive_memory";

const SCENARIOS: Record<string, PracticeScenario> = {
  coffee: {
    id: "coffee",
    scenarioIcon: "coffee",
    speechContext: "Fika med vänner",
    partnerZones: [
      {
        id: "speaker-1",
        colorTheme: "emerald",
        isActive: true,
        tiles: [
          {
            id: "tile-coffee-1",
            iconKey: "coffee",
            confidence: 0.95,
            isGroundTruth: true,
            speechText: "Vill du ha lite mer kaffe?",
            category: "food",
          },
          {
            id: "tile-cake-2",
            iconKey: "cake",
            confidence: 0.65, // Medelhög: Frågetecken visas
            isGroundTruth: false,
            speechText: "Kanske smakar det bra med en kanelbulle?",
            category: "food",
          },
          {
            id: "tile-low-conf",
            iconKey: "apple",
            confidence: 0.35, // Låg: Filtreras bort helt!
            isGroundTruth: false,
            speechText: "Något ovidkommande som ska ignoreras",
            category: "food",
          },
        ],
      },
      {
        id: "speaker-2",
        colorTheme: "amber",
        isActive: false,
        tiles: [
          {
            id: "tile-sun-3",
            iconKey: "sun",
            confidence: 0.88,
            isGroundTruth: true,
            speechText: "Det är så härligt och varmt ute idag.",
            category: "social",
          },
          {
            id: "tile-water-4",
            iconKey: "water",
            confidence: 0.72, // Frågetecken visas
            isGroundTruth: false,
            speechText: "Vill du ha ett kallt glas vatten?",
            category: "food",
          },
        ],
      },
    ],
  },
  cart: {
    id: "cart",
    scenarioIcon: "cart",
    speechContext: "Matbutik & Inköp",
    partnerZones: [
      {
        id: "speaker-1",
        colorTheme: "sky",
        isActive: true,
        tiles: [
          {
            id: "tile-apple-1",
            iconKey: "apple",
            confidence: 0.92,
            isGroundTruth: true,
            speechText: "Vi ska köpa med oss färsk frukt hem.",
            category: "food",
          },
          {
            id: "tile-cart-2",
            iconKey: "cart",
            confidence: 0.70,
            isGroundTruth: false,
            speechText: "Ska vi ta en större kundvagn?",
            category: "need",
          },
        ],
      },
    ],
  },
  heart: {
    id: "heart",
    scenarioIcon: "heart",
    speechContext: "Hälsa & Omtanke",
    partnerZones: [
      {
        id: "speaker-1",
        colorTheme: "stone",
        isActive: true,
        tiles: [
          {
            id: "tile-pill-1",
            iconKey: "pill",
            confidence: 0.91,
            isGroundTruth: true,
            speechText: "Hur känns det med din medicinering?",
            category: "health",
          },
          {
            id: "tile-heart-2",
            iconKey: "heart",
            confidence: 0.62,
            isGroundTruth: false,
            speechText: "Känns hjärtat och kroppen i lugn och ro?",
            category: "health",
          },
        ],
      },
    ],
  },
};

export function useAacDisplay() {
  const [state, setState] = useState<AacDisplayState>({
    mode: "IDLE",
    speakerZones: [
      { id: "speaker-1", colorTheme: "emerald", tiles: [], isActive: false },
      { id: "speaker-2", colorTheme: "amber", tiles: [], isActive: false },
    ],
    activeScenarioId: null,
    lastSpokenText: null,
    feedbackRecords: [],
    isListening: false,
    consentGranted: false,
  });

  const [selectedTile, setSelectedTile] = useState<AacTile | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<"confirmed" | "rejected" | null>(null);

  // Talsyntesfunktion
  const speakText = useCallback((text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "sv-SE";
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback om röst inte är tillgänglig i miljö
      }
    }
  }, []);

  // Välj scenbricka (Fika, Handla, Hälsa, Vila/Hem)
  const selectScenario = useCallback((scenarioKey: "coffee" | "cart" | "heart" | "home") => {
    if (scenarioKey === "home") {
      // Återgå till vilsamt tomt läge
      setState((prev) => ({
        ...prev,
        mode: "IDLE",
        activeScenarioId: null,
        speakerZones: [
          { id: "speaker-1", colorTheme: "emerald", tiles: [], isActive: false },
          { id: "speaker-2", colorTheme: "amber", tiles: [], isActive: false },
        ],
      }));
      setSelectedTile(null);
      setFeedbackStatus(null);
      return;
    }

    const scenario = SCENARIOS[scenarioKey];
    if (scenario) {
      // Filtrera och justera brickor med inlärda vikter från adaptive memory
      const verifiedZones = scenario.partnerZones.map((zone) => ({
        ...zone,
        tiles: defaultAdaptiveMemory.applyLearnedWeights(scenarioKey, zone.tiles),
      }));

      setState((prev) => ({
        ...prev,
        mode: "PRACTICE",
        activeScenarioId: scenarioKey,
        speakerZones: verifiedZones,
      }));
      setSelectedTile(null);
      setFeedbackStatus(null);
    }
  }, []);

  // Välj en bildbricka
  const handleSelectTile = useCallback((tile: AacTile) => {
    setSelectedTile(tile);
    setFeedbackStatus(null);
    setState((prev) => ({ ...prev, lastSpokenText: tile.speechText }));
    speakText(tile.speechText);
  }, [speakText]);

  // Bekräfta gissning (Grön bock)
  const handleConfirm = useCallback(() => {
    if (!selectedTile) return;

    const record: FeedbackRecord = {
      tileId: selectedTile.id,
      action: "confirm",
      timestamp: Date.now(),
    };

    // Spara i den adaptiva minnesmotorn
    defaultAdaptiveMemory.recordFeedback({
      contextKey: state.activeScenarioId || "general",
      tileId: selectedTile.id,
      iconKey: selectedTile.iconKey,
      action: "confirm",
      initialConfidence: selectedTile.confidence,
    });

    setFeedbackStatus("confirmed");

    // Höj konfidensen för den valda brickan så att frågetecknet tonas bort
    setState((prev) => ({
      ...prev,
      feedbackRecords: [record, ...prev.feedbackRecords],
      speakerZones: prev.speakerZones.map((zone) => ({
        ...zone,
        tiles: zone.tiles.map((t) =>
          t.id === selectedTile.id ? { ...t, confidence: 0.98, isGroundTruth: true } : t
        ),
      })),
    }));

    speakText("Ja, precis så.");
  }, [selectedTile, speakText, state.activeScenarioId]);

  // Avfärda gissning (Rött kryss)
  const handleReject = useCallback(() => {
    if (!selectedTile) return;

    const record: FeedbackRecord = {
      tileId: selectedTile.id,
      action: "reject",
      timestamp: Date.now(),
    };

    // Spara avfärdande i den adaptiva minnesmotorn så att den dämpas permanent
    defaultAdaptiveMemory.recordFeedback({
      contextKey: state.activeScenarioId || "general",
      tileId: selectedTile.id,
      iconKey: selectedTile.iconKey,
      action: "reject",
      initialConfidence: selectedTile.confidence,
    });

    setFeedbackStatus("rejected");

    // Rensa bort den felaktiga brickan från zonen så att utrymmet förblir lugnt och tomt
    setState((prev) => ({
      ...prev,
      feedbackRecords: [record, ...prev.feedbackRecords],
      speakerZones: prev.speakerZones.map((zone) => ({
        ...zone,
        tiles: zone.tiles.filter((t) => t.id !== selectedTile.id),
      })),
    }));

    setSelectedTile(null);
    speakText("Nej, inte det.");
  }, [selectedTile, speakText, state.activeScenarioId]);

  // Växla mikrofon och muntligt samtycke
  const toggleListening = useCallback(() => {
    setState((prev) => {
      const nextListening = !prev.isListening;
      if (nextListening && !prev.consentGranted) {
        speakText(
          "Hej! För att stödja Kalle i samtalet lyssnar jag och skapar bilder av vad vi pratar om. Är det okej för alla i rummet?"
        );
      }
      return {
        ...prev,
        isListening: nextListening,
        consentGranted: true,
      };
    });
  }, [speakText]);

  return {
    state,
    selectedTile,
    feedbackStatus,
    selectScenario,
    handleSelectTile,
    handleConfirm,
    handleReject,
    toggleListening,
  };
}
