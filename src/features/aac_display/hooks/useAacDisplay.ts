import { useState, useCallback, useEffect, useRef } from "react";
import {
  AacTile,
  PracticeScenario,
  FeedbackRecord,
  AacDisplayState,
  ColorTheme,
  SpeakerZone,
} from "../domain/types";
import { defaultAdaptiveMemory } from "../../adaptive_memory";
import { defaultLiveListener } from "../../live_listener";
import { ListenerStatus } from "../../live_listener/domain/types";
import { defaultSymbolEngine } from "../../symbol_engine";

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
    speechContext: "Gruppsamtal & Omtanke",
    partnerZones: [
      {
        id: "speaker-1",
        colorTheme: "emerald",
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
      {
        id: "speaker-2",
        colorTheme: "violet",
        isActive: false,
        tiles: [
          {
            id: "tile-smile-3",
            iconKey: "smile",
            confidence: 0.89,
            isGroundTruth: true,
            speechText: "Vi är här för att stötta dig idag.",
            category: "social",
          },
        ],
      },
      {
        id: "speaker-3",
        colorTheme: "rose",
        isActive: false,
        tiles: [
          {
            id: "tile-water-5",
            iconKey: "water",
            confidence: 0.84,
            isGroundTruth: true,
            speechText: "Vill du ha lite mer vatten eller vila?",
            category: "need",
          },
        ],
      },
    ],
  },
};

export function useAacDisplay() {
  const [state, setState] = useState<AacDisplayState>({
    mode: "IDLE",
    speakerZones: [],
    activeScenarioId: null,
    lastSpokenText: null,
    feedbackRecords: [],
    isListening: false,
    consentGranted: false,
    messageQueue: [],
    selectedQueueIndex: null,
    isBreathingPause: false,
  });

  const breathingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (breathingTimerRef.current) {
        clearTimeout(breathingTimerRef.current);
      }
    };
  }, []);

  const [listenerStatus, setListenerStatus] = useState<ListenerStatus>(
    defaultLiveListener.getStatus()
  );
  const [lastEventStatus, setLastEventStatus] = useState<string>(
    defaultLiveListener.getLastEventStatus()
  );
  const [selectedTile, setSelectedTile] = useState<AacTile | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<"confirmed" | "rejected" | null>(null);

  // Visuell statusindikator för Gemini Live-anslutning:
  // - "disconnected": Röd/grå punkt (frånkopplad / inget svar)
  // - "connecting": Gul punkt (ansluter till Gemini Live...)
  // - "active": Grön pulserande punkt (aktiv och lyssnar efter samtal / "Maggan")
  const connectionStatus: "disconnected" | "connecting" | "active" = (() => {
    if (!state.isListening || listenerStatus === "idle") return "disconnected";
    if (listenerStatus === "connecting" || listenerStatus === "awaiting_consent")
      return "connecting";
    if (listenerStatus === "listening") return "active";
    return "disconnected";
  })();

  // Talsyntesfunktion med volymkontroll för offentlig vs privat röst [RULE-005]
  const speakText = useCallback((text: string, volume = 1.0) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "sv-SE";
        utterance.rate = 0.9;
        utterance.volume = volume;
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
        speakerZones: [],
        messageQueue: [],
        selectedQueueIndex: null,
        isBreathingPause: false,
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

  // Välj en bildbricka och lägg till i elastisk budskapsrad (max 5) [RULE-006 & ADR-019]
  const handleSelectTile = useCallback((tile: AacTile) => {
    setSelectedTile(tile);
    setFeedbackStatus(null);
    setState((prev) => {
      const nextQueue =
        prev.messageQueue.length < 5
          ? [...prev.messageQueue, tile]
          : prev.messageQueue;
      return {
        ...prev,
        lastSpokenText: tile.speechText,
        messageQueue: nextQueue,
      };
    });
    speakText(tile.speechText);
  }, [speakText]);

  // Privat provläsning och punktmarkering i budskapsraden [RULE-015 & RULE-005]
  const handleSelectQueueTile = useCallback((index: number) => {
    setState((prev) => {
      const tile = prev.messageQueue[index];
      if (tile) {
        speakText(tile.speechText, 0.5);
      }
      return {
        ...prev,
        selectedQueueIndex: index,
      };
    });
  }, [speakText]);

  // Punktkorrigering: radera enbart vald symbol ur budskapsraden med Typ A kryss [RULE-015]
  const handleRemoveQueueTile = useCallback((index: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setState((prev) => {
      const updatedQueue = prev.messageQueue.filter((_, idx) => idx !== index);
      return {
        ...prev,
        messageQueue: updatedQueue,
        selectedQueueIndex: null,
      };
    });
  }, []);

  // Bekräfta budskap eller gissning (Grön bock) [RULE-005, SYSTEM-001 & RULE-008]
  const handleConfirm = useCallback(() => {
    if (state.messageQueue.length > 0) {
      const sentence = state.messageQueue.map((t) => t.speechText).join(" ");
      speakText(sentence, 1.0);
      defaultLiveListener.sendTextImpulse(sentence);

      // Spara i adaptiva minnet för varje ingående symbol
      state.messageQueue.forEach((tile) => {
        defaultAdaptiveMemory.recordFeedback({
          contextKey: state.activeScenarioId || "general",
          tileId: tile.id,
          iconKey: tile.iconKey,
          action: "confirm",
          initialConfidence: tile.confidence,
        });
      });

      setFeedbackStatus("confirmed");

      // Aktivera 3000 ms vilsam andningspaus före reset [RULE-008]
      if (breathingTimerRef.current) {
        clearTimeout(breathingTimerRef.current);
      }
      setState((prev) => ({
        ...prev,
        isBreathingPause: true,
        selectedQueueIndex: null,
      }));

      breathingTimerRef.current = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          messageQueue: [],
          isBreathingPause: false,
          selectedQueueIndex: null,
        }));
        setSelectedTile(null);
        setFeedbackStatus(null);
        breathingTimerRef.current = null;
      }, 3000);
      return;
    }

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
  }, [selectedTile, speakText, state.activeScenarioId, state.messageQueue]);

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

  // Koppla samman liveListener-händelser
  useEffect(() => {
    const originalSynthesizer = (text: string) => speakText(text);
    defaultLiveListener.setSpeechSynthesizer(originalSynthesizer);

    defaultLiveListener.setOnStatusChange((status) => {
      setListenerStatus(status);
    });

    const unsubDiag = defaultLiveListener.onDiagnosticEvent((status) => {
      setLastEventStatus(status);
    });

    const COLOR_PALETTE: ColorTheme[] = [
      "emerald",
      "amber",
      "violet",
      "rose",
      "sky",
      "stone",
    ];

    defaultLiveListener.setOnUtterance((event) => {
      setState((prev) => {
        const existingIdx = prev.speakerZones.findIndex((z) => z.id === event.speakerId);

        let updatedZones: SpeakerZone[];

        if (existingIdx === -1) {
          // Skapa ny dynamisk zon till vänster endast när en talare faktiskt detekteras
          const colorTheme = COLOR_PALETTE[prev.speakerZones.length % COLOR_PALETTE.length];
          const newZone: SpeakerZone = {
            id: event.speakerId,
            colorTheme,
            tiles: event.tiles.slice(0, 4),
            isActive: true,
          };
          updatedZones = [
            ...prev.speakerZones.map((z) => ({ ...z, isActive: false })),
            newZone,
          ];
        } else {
          // Uppdatera befintlig talare med nya symboler och markera som aktiv
          updatedZones = prev.speakerZones.map((z, idx) => {
            if (idx === existingIdx) {
              const existingKeys = new Set(z.tiles.map((t) => t.iconKey));
              const freshTiles = event.tiles.filter((t) => !existingKeys.has(t.iconKey));
              return {
                ...z,
                tiles: [...z.tiles, ...freshTiles].slice(0, 4),
                isActive: true,
              };
            }
            return { ...z, isActive: false };
          });
        }

        return {
          ...prev,
          mode: "LIVE",
          speakerZones: updatedZones,
        };
      });
    });

    defaultLiveListener.setOnActiveSpeakerChange((speakerId) => {
      if (speakerId === null) return;
      setState((prev) => ({
        ...prev,
        speakerZones: prev.speakerZones.map((zone) => ({
          ...zone,
          isActive: zone.id === speakerId,
        })),
      }));
    });

    return () => {
      unsubDiag();
    };
  }, [speakText]);

  // Frikopplad mikro-feedback: Tyst avfärdande med automatisk ersättning i realtid
  const handleDismissTileSilent = useCallback(
    async (zoneId: string, tile: AacTile) => {
      // 1. Töm rutan omedelbart i UI utan talsyntes
      setState((prev) => ({
        ...prev,
        speakerZones: prev.speakerZones.map((zone) =>
          zone.id === zoneId
            ? { ...zone, tiles: zone.tiles.filter((t) => t.id !== tile.id) }
            : zone
        ),
      }));

      setSelectedTile((curr) => (curr?.id === tile.id ? null : curr));

      // 2. Spara i adaptiva minnet med sänkt konfidens (<0.50) och hämta ersättare
      const replacement = await defaultSymbolEngine.requestReplacementTile({
        zoneId,
        rejectedTile: tile,
        contextKey: state.activeScenarioId || "general",
      });

      // 3. Om ersättare hittades, injicera den mjukt i zonen
      if (replacement) {
        setState((prev) => ({
          ...prev,
          speakerZones: prev.speakerZones.map((zone) => {
            if (zone.id === zoneId) {
              const alreadyPresent = zone.tiles.some((t) => t.iconKey === replacement.iconKey);
              if (alreadyPresent) return zone;
              return {
                ...zone,
                tiles: [...zone.tiles, replacement].slice(0, 4),
              };
            }
            return zone;
          }),
        }));
      }
    },
    [state.activeScenarioId]
  );

  // Frikopplad mikro-feedback: Tyst bekräftelse utan att läsa upp högt
  const handleConfirmTileSilent = useCallback(
    (_zoneId: string, tile: AacTile) => {
      defaultSymbolEngine.recordSilentConfirmation(state.activeScenarioId || "general", tile);
      setFeedbackStatus("confirmed");
      setTimeout(() => setFeedbackStatus(null), 1000);
    },
    [state.activeScenarioId]
  );

  // Växla mikrofon och muntligt samtycke
  const toggleListening = useCallback(() => {
    // Web Audio Autoplay Policy: resume() anropas synkront i användarens klick
    defaultLiveListener.resumeAudio().catch(() => {});

    setState((prev) => {
      const nextListening = !prev.isListening;
      if (nextListening) {
        setListenerStatus("connecting");
        defaultLiveListener.startListening(true);
        defaultLiveListener.confirmConsent(true);
        setTimeout(() => {
          setListenerStatus("listening");
        }, 350);
      } else {
        defaultLiveListener.stopListening();
        setListenerStatus("idle");
      }
      return {
        ...prev,
        isListening: nextListening,
        consentGranted: true,
      };
    });
  }, []);

  // Rensa markering, budskapsrad och avbryt eventuell andningspaus
  const handleClear = useCallback(() => {
    if (breathingTimerRef.current) {
      clearTimeout(breathingTimerRef.current);
      breathingTimerRef.current = null;
    }
    setSelectedTile(null);
    setFeedbackStatus(null);
    setState((prev) => ({
      ...prev,
      messageQueue: [],
      selectedQueueIndex: null,
      isBreathingPause: false,
    }));
  }, []);

  return {
    state,
    selectedTile,
    feedbackStatus,
    messageQueue: state.messageQueue,
    selectedQueueIndex: state.selectedQueueIndex,
    isBreathingPause: state.isBreathingPause,
    selectScenario,
    handleSelectTile,
    handleConfirm,
    handleReject,
    handleClear,
    handleSelectQueueTile,
    handleRemoveQueueTile,
    handleDismissTileSilent,
    handleConfirmTileSilent,
    toggleListening,
    connectionStatus,
    lastEventStatus,
  };
}
