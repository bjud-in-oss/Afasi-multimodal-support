import { ListenerStatus, ListenerOptions, SpeakerId, LiveUtteranceEvent, ConsentState } from "./types";
import { AacTile } from "../../aac_display/domain/types";
import { defaultAdaptiveMemory } from "../../adaptive_memory";

const resolveGeminiApiKey = (): string | undefined => {
  if (typeof process !== "undefined" && process.env && process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  if (
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_GEMINI_API_KEY
  ) {
    return import.meta.env.VITE_GEMINI_API_KEY as string;
  }
  return undefined;
};

const DEFAULT_CONSENT_MSG =
  "Hej! För att stödja Kalle i samtalet lyssnar jag och skapar bilder av vad vi pratar om. Är det okej för alla i rummet?";

// Ordbok för direkt matchning av talade begrepp till symbolnycklar
const VOCABULARY_MAP: Record<
  string,
  { iconKey: AacTile["iconKey"]; speechText: string; baseConfidence: number }
> = {
  kaffe: { iconKey: "coffee", speechText: "Kaffe", baseConfidence: 0.95 },
  kopp: { iconKey: "coffee", speechText: "En kopp kaffe", baseConfidence: 0.85 },
  kaka: { iconKey: "cake", speechText: "Kaka", baseConfidence: 0.65 },
  bulle: { iconKey: "cake", speechText: "Kanelbulle", baseConfidence: 0.7 },
  kanelbulle: { iconKey: "cake", speechText: "Kanelbulle", baseConfidence: 0.9 },
  vatten: { iconKey: "water", speechText: "Vatten", baseConfidence: 0.95 },
  dricka: { iconKey: "water", speechText: "Dricka vatten", baseConfidence: 0.8 },
  äpple: { iconKey: "apple", speechText: "Äpple", baseConfidence: 0.95 },
  frukt: { iconKey: "apple", speechText: "Frukt", baseConfidence: 0.75 },
  handla: { iconKey: "cart", speechText: "Handla mat", baseConfidence: 0.85 },
  köpa: { iconKey: "cart", speechText: "Köpa mat", baseConfidence: 0.8 },
  mat: { iconKey: "cart", speechText: "Matvaror", baseConfidence: 0.75 },
  medicin: { iconKey: "pill", speechText: "Medicin", baseConfidence: 0.95 },
  tablett: { iconKey: "pill", speechText: "Tablett", baseConfidence: 0.9 },
  glad: { iconKey: "smile", speechText: "Glad och nöjd", baseConfidence: 0.9 },
  mår: { iconKey: "smile", speechText: "Mår bra", baseConfidence: 0.65 },
  bra: { iconKey: "smile", speechText: "Allt är bra", baseConfidence: 0.8 },
  trött: { iconKey: "heart", speechText: "Trött eller behöver vila", baseConfidence: 0.85 },
  vila: { iconKey: "heart", speechText: "Vila en stund", baseConfidence: 0.9 },
  promenad: { iconKey: "sun", speechText: "Gå ut på en promenad", baseConfidence: 0.9 },
  sol: { iconKey: "sun", speechText: "Soligt och fint ute", baseConfidence: 0.9 },
  hem: { iconKey: "home", speechText: "Gå hem", baseConfidence: 0.9 },
  hjälp: { iconKey: "help", speechText: "Behöver hjälp", baseConfidence: 0.95 },
};

export class LiveListenerService {
  private status: ListenerStatus = "idle";
  private consent: ConsentState = { requested: false, granted: false };
  private options: ListenerOptions;
  private speechSynthesizer: (text: string) => void;
  private apiKey: string | undefined = resolveGeminiApiKey();

  constructor(options: ListenerOptions = {}) {
    this.options = options;
    this.speechSynthesizer = (text: string) => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "sv-SE";
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    };
  }

  public setSpeechSynthesizer(fn: (text: string) => void): void {
    this.speechSynthesizer = fn;
  }

  public setOnUtterance(cb: ((event: LiveUtteranceEvent) => void) | undefined): void {
    this.options.onUtterance = cb;
  }

  public setOnActiveSpeakerChange(
    cb: ((speakerId: SpeakerId | null) => void) | undefined
  ): void {
    this.options.onActiveSpeakerChange = cb;
  }

  public setOnStatusChange(cb: ((status: ListenerStatus) => void) | undefined): void {
    this.options.onStatusChange = cb;
  }

  public getApiKey(): string | undefined {
    return this.apiKey;
  }

  public setApiKey(key: string): void {
    this.apiKey = key;
  }

  public getStatus(): ListenerStatus {
    return this.status;
  }

  public isConsentGranted(): boolean {
    return this.consent.granted;
  }

  public setStatus(status: ListenerStatus): void {
    this.status = status;
    this.notifyStatus();
  }

  public startListening(): void {
    if (!this.consent.granted) {
      this.status = "awaiting_consent";
      this.consent.requested = true;
      this.notifyStatus();

      const message = this.options.consentMessage || DEFAULT_CONSENT_MSG;
      this.speechSynthesizer(message);
      return;
    }

    this.status = "listening";
    this.notifyStatus();
  }

  public confirmConsent(): void {
    this.consent.granted = true;
    this.consent.timestamp = Date.now();
    this.status = "listening";
    this.notifyStatus();
    this.speechSynthesizer("Tack, nu lyssnar jag på samtalet.");
  }

  public pauseListening(): void {
    if (this.status === "listening") {
      this.status = "paused";
      this.notifyStatus();
    }
  }

  public resumeListening(): void {
    if (this.status === "paused" && this.consent.granted) {
      this.status = "listening";
      this.notifyStatus();
    }
  }

  public stopListening(): void {
    this.status = "idle";
    this.notifyStatus();
    if (this.options.onActiveSpeakerChange) {
      this.options.onActiveSpeakerChange(null);
    }
  }

  public resetConsent(): void {
    this.consent = { requested: false, granted: false };
    this.status = "idle";
    this.notifyStatus();
  }

  public simulateUtterance(speakerId: SpeakerId, text: string): LiveUtteranceEvent | null {
    if (this.status !== "listening") {
      return null;
    }

    if (this.options.onActiveSpeakerChange) {
      this.options.onActiveSpeakerChange(speakerId);
      // Rensa aktiv markör efter en stund
      setTimeout(() => {
        if (this.options.onActiveSpeakerChange) {
          this.options.onActiveSpeakerChange(null);
        }
      }, 3000);
    }

    const lower = text.toLowerCase();
    const rawTiles: AacTile[] = [];

    // Hitta matchande symboler i meningen
    for (const [word, config] of Object.entries(VOCABULARY_MAP)) {
      if (lower.includes(word)) {
        rawTiles.push({
          id: `live-tile-${speakerId}-${config.iconKey}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          iconKey: config.iconKey,
          confidence: config.baseConfidence,
          isGroundTruth: config.baseConfidence >= 0.8,
          speechText: config.speechText,
        });
      }
    }

    // Applicera användarens historiskt inlärda vikter från adaptive_memory
    const contextKey = "general";
    const weightedTiles = defaultAdaptiveMemory.applyLearnedWeights(contextKey, rawTiles);

    const event: LiveUtteranceEvent = {
      id: `utterance-${Date.now()}`,
      speakerId,
      text,
      tiles: weightedTiles,
      timestamp: Date.now(),
    };

    if (this.options.onUtterance) {
      this.options.onUtterance(event);
    }

    return event;
  }

  private notifyStatus(): void {
    if (this.options.onStatusChange) {
      this.options.onStatusChange(this.status);
    }
  }
}

export const defaultLiveListener = new LiveListenerService();
