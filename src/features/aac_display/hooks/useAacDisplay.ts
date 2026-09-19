import { useState, useCallback, useEffect } from "react";
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
  });

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

  // Välj scenbricka (Fika, Handla, Hälsa, Vila/Hem)
  const selectScenario = useCallback((scenarioKey: "coffee" | "cart" | "heart" | "home") => {
    if (scenarioKey === "home") {
      // Återgå till vilsamt tomt läge
      setState((prev) => ({
        ...prev,
        mode: "IDLE",
        activeScenarioId: null,
        speakerZones: [],
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

  // Välj en bildbricka och skicka textinput till Gemini Live (ersätter lokal TTS)
  const handleSelectTile = useCallback((tile: AacTile) => {
    setSelectedTile(tile);
    setFeedbackStatus(null);
    setState((prev) => ({ ...prev, lastSpokenText: tile.speechText }));
    defaultLiveListener.sendTextInput(tile.speechText);
  }, []);

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

    defaultLiveListener.sendTextInput("Ja, precis så.");
  }, [selectedTile, state.activeScenarioId]);

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
    defaultLiveListener.sendTextInput("Nej, inte det.");
  }, [selectedTile, state.activeScenarioId]);

  // Koppla samman liveListener-händelser
  useEffect(() => {
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
  }, []);

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
    setState((prev) => {
      const nextListening = !prev.isListening;
      if (nextListening) {
        setListenerStatus("connecting");
        defaultLiveListener.startListening();
        defaultLiveListener.confirmConsent();
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

  // Dynamiska kontrollbrickor i högerzonen (4 mest relevanta brickorna baserat på tid, kamera, samtal och AdaptiveMemory)
  const dynamicControlTiles: AacTile[] = (() => {
    const hour = new Date().getHours();
    const detected = defaultLiveListener.getDetectedObjects();
    const activeZoneTiles = state.speakerZones.flatMap((z) => z.tiles);

    // Baskandidater anpassade efter tid på dygnet (morgonfika, lunch, eftermiddag, kvällsmat/vila)
    let candidates: Array<{
      iconKey: AacTile["iconKey"];
      speechText: string;
      baseConfidence: number;
    }> = [];

    if (hour >= 6 && hour < 11) {
      candidates = [
        { iconKey: "coffee", speechText: "Kaffe och frukost", baseConfidence: 0.95 },
        { iconKey: "cart", speechText: "Handla", baseConfidence: 0.88 },
        { iconKey: "heart", speechText: "Hälsa och omtanke", baseConfidence: 0.85 },
        { iconKey: "home", speechText: "Vara hemma och vila", baseConfidence: 0.82 },
      ];
    } else if (hour >= 11 && hour < 14) {
      candidates = [
        { iconKey: "cart", speechText: "Handla mat", baseConfidence: 0.95 },
        { iconKey: "coffee", speechText: "Kaffe efter maten", baseConfidence: 0.9 },
        { iconKey: "heart", speechText: "Hälsa och vila", baseConfidence: 0.85 },
        { iconKey: "home", speechText: "Vara hemma", baseConfidence: 0.8 },
      ];
    } else if (hour >= 14 && hour < 18) {
      candidates = [
        { iconKey: "coffee", speechText: "Eftermiddagsfika", baseConfidence: 0.95 },
        { iconKey: "cart", speechText: "Handla mat", baseConfidence: 0.9 },
        { iconKey: "heart", speechText: "Hälsa och vila", baseConfidence: 0.88 },
        { iconKey: "home", speechText: "Vara hemma och vila", baseConfidence: 0.85 },
      ];
    } else {
      candidates = [
        { iconKey: "home", speechText: "Vara hemma och vila", baseConfidence: 0.95 },
        { iconKey: "heart", speechText: "Vila och sova", baseConfidence: 0.9 },
        { iconKey: "coffee", speechText: "Kvällsfika", baseConfidence: 0.85 },
        { iconKey: "cart", speechText: "Handla imorgon", baseConfidence: 0.82 },
      ];
    }

    const rawTiles: AacTile[] = candidates.map((c) => {
      let conf = c.baseConfidence;
      let stage: AacTile["enrichmentStage"] = "standard";
      let matchedObj: string | undefined = undefined;

      // Berika med kameraobjekt
      const isDetected = detected.find(
        (o) =>
          c.speechText.toLowerCase().includes(o.toLowerCase()) ||
          c.iconKey.toLowerCase().includes(o.toLowerCase())
      );
      if (isDetected) {
        conf = Math.min(1.0, conf + 0.15);
        stage = "camera_enriched";
        matchedObj = isDetected;
      }

      // Berika med aktiv samtalstråd
      if (activeZoneTiles.some((t) => t.iconKey === c.iconKey)) {
        conf = Math.min(1.0, conf + 0.1);
      }

      return {
        id: `control-${c.iconKey}`,
        iconKey: c.iconKey,
        confidence: conf,
        isGroundTruth: conf >= 0.8,
        speechText: c.speechText,
        enrichmentStage: stage,
        detectedObject: matchedObj,
      };
    });

    const weighted = defaultAdaptiveMemory.applyLearnedWeights("user_control_zone", rawTiles);
    weighted.sort((a, b) => b.confidence - a.confidence);

    return weighted.slice(0, 4);
  })();

  return {
    state,
    selectedTile,
    feedbackStatus,
    selectScenario,
    handleSelectTile,
    handleConfirm,
    handleReject,
    handleDismissTileSilent,
    handleConfirmTileSilent,
    toggleListening,
    connectionStatus,
    lastEventStatus,
    dynamicControlTiles,
  };
}
