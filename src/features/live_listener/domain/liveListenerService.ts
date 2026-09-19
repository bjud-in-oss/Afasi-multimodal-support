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
  private apiKey: string | undefined = resolveGeminiApiKey();
  private lastEventStatus: string = "Frånkopplad (Väntar på aktivering)";
  private pcmPacketsOut: number = 0;
  private diagnosticSubscribers: Set<(status: string) => void> = new Set();
  private speechSynthesizer: ((text: string) => void) | null = null;

  // Web Audio Context för Gemini inkommande PCM16-ljud
  private audioContext: AudioContext | null = null;
  private activeAudioSources: AudioBufferSourceNode[] = [];
  private nextScheduledPlayTime: number = 0;

  // Mikrofonströmning
  private micStream: MediaStream | null = null;
  private micAudioContext: AudioContext | null = null;
  private micProcessor: ScriptProcessorNode | null = null;

  // Kamera-vision
  private cameraStream: MediaStream | null = null;
  private cameraVideoElement: HTMLVideoElement | null = null;
  private cameraCanvasElement: HTMLCanvasElement | null = null;
  private cameraIntervalId: any = null;
  private detectedObjects: string[] = [];

  // WebSocket till Gemini Live API
  private webSocket: WebSocket | null = null;

  constructor(options: ListenerOptions = {}) {
    this.options = options;
  }

  public setSpeechSynthesizer(fn: ((text: string) => void) | null): void {
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

  public setOnDiagnosticEvent(cb: ((status: string) => void) | undefined): void {
    this.options.onDiagnosticEvent = cb;
  }

  public onDiagnosticEvent(cb: (status: string) => void): () => void {
    this.diagnosticSubscribers.add(cb);
    cb(this.lastEventStatus);
    return () => {
      this.diagnosticSubscribers.delete(cb);
    };
  }

  public getLastEventStatus(): string {
    return this.lastEventStatus;
  }

  public getDetectedObjects(): string[] {
    return [...this.detectedObjects];
  }

  public setDetectedObjects(objects: string[]): void {
    this.detectedObjects = objects;
    this.updateDiagnosticStatus(`Kameraobjekt: ${objects.join(", ")}`);
  }

  public getCurrentTimeString(): string {
    const now = new Date();
    return now.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
  }

  public logPcmPacket(count?: number): void {
    if (typeof count === "number") {
      this.pcmPacketsOut = count;
    } else {
      this.pcmPacketsOut += 1;
    }
    this.updateDiagnosticStatus(`PCM Packets Out: ${this.pcmPacketsOut}`);
  }

  public logGeminiEvent(eventType: string): void {
    this.updateDiagnosticStatus(`Gemini Event: ${eventType}`);
  }

  public logFunctionCall(functionName: string = "update_topic_zones"): void {
    this.updateDiagnosticStatus(`FunctionCall: ${functionName}`);
  }

  public logDiagnostic(status: string): void {
    this.updateDiagnosticStatus(status);
  }

  private updateDiagnosticStatus(newStatus: string): void {
    this.lastEventStatus = newStatus;
    if (this.options.onDiagnosticEvent) {
      this.options.onDiagnosticEvent(newStatus);
    }
    for (const sub of this.diagnosticSubscribers) {
      try {
        sub(newStatus);
      } catch (err) {
        console.error("Error in diagnostic subscriber:", err);
      }
    }
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
      this.updateDiagnosticStatus("Gemini Event: session.awaiting_consent");

      const message = this.options.consentMessage || DEFAULT_CONSENT_MSG;
      if (this.speechSynthesizer) {
        this.speechSynthesizer(message);
      }
      return;
    }

    this.status = "listening";
    this.notifyStatus();
    this.logGeminiEvent("session.ready");
    this.initMultimodalLiveSession();
  }

  public confirmConsent(): void {
    this.consent.granted = true;
    this.consent.timestamp = Date.now();
    this.status = "listening";
    this.notifyStatus();
    this.pcmPacketsOut = 0;
    this.logGeminiEvent("session.ready");
    this.logFunctionCall("update_topic_zones");
    if (this.speechSynthesizer) {
      this.speechSynthesizer("Tack, nu lyssnar jag på samtalet.");
    }
    this.initMultimodalLiveSession();
  }

  public pauseListening(): void {
    if (this.status === "listening") {
      this.status = "paused";
      this.notifyStatus();
      this.updateDiagnosticStatus("Gemini Event: session.paused");
      this.stopMicrophoneStream();
      this.stopCamera();
    }
  }

  public resumeListening(): void {
    if (this.status === "paused" && this.consent.granted) {
      this.status = "listening";
      this.notifyStatus();
      this.updateDiagnosticStatus("Gemini Event: session.resumed");
      this.initMultimodalLiveSession();
    }
  }

  public stopListening(): void {
    this.status = "idle";
    this.notifyStatus();
    this.updateDiagnosticStatus("Frånkopplad (Väntar på aktivering)");
    this.stopAudioPlayback();
    this.stopMicrophoneStream();
    this.stopCamera();
    this.closeWebSocket();
    if (this.options.onActiveSpeakerChange) {
      this.options.onActiveSpeakerChange(null);
    }
  }

  public resetConsent(): void {
    this.consent = { requested: false, granted: false };
    this.status = "idle";
    this.notifyStatus();
    this.updateDiagnosticStatus("Frånkopplad (Väntar på aktivering)");
    this.stopListening();
  }

  /**
   * Skickar en direkt clientContent/textInput-impuls över den aktiva Gemini Live WebSocket-strömmen
   * när användaren klickar på en bricka.
   */
  public sendTextInput(text: string): void {
    this.logGeminiEvent("clientContent.textInput");
    this.updateDiagnosticStatus(`Textimpuls: "${text}"`);

    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      const payload = {
        clientContent: {
          turns: [
            {
              role: "user",
              parts: [{ text }],
            },
          ],
          turnComplete: true,
        },
      };
      try {
        this.webSocket.send(JSON.stringify(payload));
      } catch (err) {
        console.error("Fel vid sändning av text över Gemini Live WebSocket:", err);
      }
    }
  }

  /**
   * Initierar WebSocket-anslutning till Gemini Live, mikrofon och kamera
   */
  private initMultimodalLiveSession(): void {
    this.initAudioContext();
    this.startMicrophoneStream();
    this.startCamera();
    this.connectGeminiLiveWebSocket();
  }

  /**
   * Initierar Web Audio API för ljudutmatning (PCM16 24kHz)
   */
  private initAudioContext(): void {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx && !this.audioContext) {
        this.audioContext = new AudioCtx({ sampleRate: 24000 });
      }
      if (this.audioContext && this.audioContext.state === "suspended") {
        this.audioContext.resume().catch(() => {});
      }
    } catch {
      // Fallback i miljöer utan AudioContext
    }
  }

  /**
   * Spelar upp inkommande PCM16-ljud (24kHz) från Gemini Live direkt i AudioContext
   */
  public playPcm16AudioChunk(base64Pcm: string): void {
    if (!base64Pcm) return;
    this.initAudioContext();
    if (!this.audioContext) return;

    try {
      const binaryString = atob(base64Pcm);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Konvertera little-endian 16-bit PCM till Float32 (-1.0 till 1.0)
      const sampleCount = Math.floor(len / 2);
      const float32Data = new Float32Array(sampleCount);
      const dataView = new DataView(bytes.buffer);

      for (let i = 0; i < sampleCount; i++) {
        const int16 = dataView.getInt16(i * 2, true);
        float32Data[i] = int16 / 32768.0;
      }

      const audioBuffer = this.audioContext.createBuffer(1, sampleCount, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      const currentTime = this.audioContext.currentTime;
      if (this.nextScheduledPlayTime < currentTime) {
        this.nextScheduledPlayTime = currentTime;
      }

      source.start(this.nextScheduledPlayTime);
      this.nextScheduledPlayTime += audioBuffer.duration;
      this.activeAudioSources.push(source);

      source.onended = () => {
        const index = this.activeAudioSources.indexOf(source);
        if (index > -1) {
          this.activeAudioSources.splice(index, 1);
        }
      };

      this.logGeminiEvent("audio.pcm_playback");
    } catch (err) {
      console.error("Kunde inte avkoda/spela PCM16-ljud:", err);
    }
  }

  /**
   * Avbryter omedelbart pågående ljuduppspelning (vid t.ex. användarinterruption)
   */
  public stopAudioPlayback(): void {
    for (const src of this.activeAudioSources) {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // Redan avslutad
      }
    }
    this.activeAudioSources = [];
    if (this.audioContext) {
      this.nextScheduledPlayTime = this.audioContext.currentTime;
    }
  }

  /**
   * Startar inspelning av mikrofon och strömmar 16kHz PCM16 mono-paket till WebSocket
   */
  public async startMicrophoneStream(): Promise<void> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return;
    }

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.micAudioContext = new AudioCtx({ sampleRate: 16000 });
      const source = this.micAudioContext.createMediaStreamSource(this.micStream);

      // Skapa en ScriptProcessorNode för att hämta råa PCM-prover
      this.micProcessor = this.micAudioContext.createScriptProcessor(4096, 1, 1);

      this.micProcessor.onaudioprocess = (e) => {
        if (this.status !== "listening") return;

        const inputChannel = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputChannel.length);

        for (let i = 0; i < inputChannel.length; i++) {
          const s = Math.max(-1, Math.min(1, inputChannel[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Konvertera Int16 till base64
        let binary = "";
        const bytes = new Uint8Array(pcm16.buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Audio = btoa(binary);

        this.logPcmPacket();

        if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
          const payload = {
            realtimeInput: {
              mediaChunks: [
                {
                  mimeType: "audio/pcm;rate=16000",
                  data: base64Audio,
                },
              ],
            },
          };
          try {
            this.webSocket.send(JSON.stringify(payload));
          } catch {
            // Tyst hantering om anslutningen bryts
          }
        }
      };

      source.connect(this.micProcessor);
      this.micProcessor.connect(this.micAudioContext.destination);
      this.updateDiagnosticStatus("Mikrofon aktiv (16kHz PCM16)");
    } catch (err) {
      console.warn("Kunde inte starta mikrofon:", err);
    }
  }

  public stopMicrophoneStream(): void {
    if (this.micProcessor) {
      try {
        this.micProcessor.disconnect();
      } catch {}
      this.micProcessor = null;
    }
    if (this.micAudioContext) {
      try {
        this.micAudioContext.close();
      } catch {}
      this.micAudioContext = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
  }

  /**
   * Startar kamera och skickar JPEG-bildrutor var 2.5 sekund över WebSocket
   */
  public async startCamera(): Promise<void> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      return;
    }

    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });

      if (typeof document !== "undefined") {
        this.cameraVideoElement = document.createElement("video");
        this.cameraVideoElement.srcObject = this.cameraStream;
        this.cameraVideoElement.playsInline = true;
        this.cameraVideoElement.muted = true;
        try {
          const playPromise = this.cameraVideoElement.play();
          if (playPromise && typeof playPromise.catch === "function") {
            await playPromise.catch(() => {});
          }
        } catch {}

        this.cameraCanvasElement = document.createElement("canvas");
        this.cameraCanvasElement.width = 640;
        this.cameraCanvasElement.height = 480;

        // Fånga och skicka bildruta var 2.5 sekund
        if (this.cameraIntervalId) clearInterval(this.cameraIntervalId);
        this.cameraIntervalId = setInterval(() => {
          this.captureAndSendVideoFrame();
        }, 2500);

        this.updateDiagnosticStatus("Kamera aktiv (2.5s intervall)");
      }
    } catch (err) {
      console.warn("Kunde inte starta kamera:", err);
    }
  }

  private captureAndSendVideoFrame(): void {
    if (
      this.status !== "listening" ||
      !this.cameraVideoElement ||
      !this.cameraCanvasElement ||
      this.cameraVideoElement.readyState < 2
    ) {
      return;
    }

    const ctx = this.cameraCanvasElement.getContext("2d");
    if (!ctx) return;

    try {
      ctx.drawImage(this.cameraVideoElement, 0, 0, 640, 480);
      const dataUrl = this.cameraCanvasElement.toDataURL("image/jpeg", 0.6);
      const base64Jpeg = dataUrl.split(",")[1];

      if (base64Jpeg && this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
        const payload = {
          realtimeInput: {
            mediaChunks: [
              {
                mimeType: "image/jpeg",
                data: base64Jpeg,
              },
            ],
          },
        };
        this.webSocket.send(JSON.stringify(payload));
        this.updateDiagnosticStatus("Kameraram skickad (image/jpeg)");
        this.logGeminiEvent("video.frame");
      }
    } catch (err) {
      console.warn("Kunde inte fånga kameraram:", err);
    }
  }

  public stopCamera(): void {
    if (this.cameraIntervalId) {
      clearInterval(this.cameraIntervalId);
      this.cameraIntervalId = null;
    }
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((t) => t.stop());
      this.cameraStream = null;
    }
    if (this.cameraVideoElement) {
      this.cameraVideoElement.srcObject = null;
      this.cameraVideoElement = null;
    }
    this.cameraCanvasElement = null;
  }

  /**
   * Upprättar tvåvägs WebSocket till Gemini Live API
   */
  private connectGeminiLiveWebSocket(): void {
    if (!this.apiKey) {
      this.updateDiagnosticStatus("Kör i lokalt demonstrationsläge (ingen API-nyckel)");
      return;
    }

    if (typeof WebSocket === "undefined") return;

    try {
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${this.apiKey}`;
      this.webSocket = new WebSocket(wsUrl);

      this.webSocket.onopen = () => {
        this.logGeminiEvent("ws.open");
        this.sendSetupMessage();
      };

      this.webSocket.onmessage = (event) => {
        this.handleIncomingGeminiMessage(event.data);
      };

      this.webSocket.onerror = (err) => {
        console.warn("Gemini Live WebSocket fel:", err);
        this.updateDiagnosticStatus("Gemini Live WebSocket anslutningsfel");
      };

      this.webSocket.onclose = () => {
        this.logGeminiEvent("ws.close");
      };
    } catch (err) {
      console.warn("Kunde inte skapa WebSocket:", err);
    }
  }

  private sendSetupMessage(): void {
    if (!this.webSocket || this.webSocket.readyState !== WebSocket.OPEN) return;

    const currentTimeStr = this.getCurrentTimeString();
    const setupMessage = {
      setup: {
        model: "models/gemini-2.0-flash-exp",
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Puck",
              },
            },
          },
        },
        systemInstruction: {
          parts: [
            {
              text: `Du är Maggan, en varm och stöttande samtalsassistent för personer med afasi. Aktuell lokal tid är ${currentTimeStr}. Anpassa samtalsstöd, ordförråd och föreslagna AAC-brickor efter tid på dygnet (morgonfika, lunch, kvällsmat, vila) och vad som syns i kameran. Svara kortfattat på svenska. Anropa verktyget update_topic_zones när samtalsämnen eller visuella föremål identifieras.`,
            },
          ],
        },
        tools: [
          {
            functionDeclarations: [
              {
                name: "update_topic_zones",
                description:
                  "Uppdaterar AAC-talarzoner med relevanta begrepp och förslag baserat på samtalet, kameran eller klockslaget.",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    speakerId: { type: "STRING" },
                    topics: {
                      type: "ARRAY",
                      items: { type: "STRING" },
                    },
                    detectedObjects: {
                      type: "ARRAY",
                      items: { type: "STRING" },
                    },
                    svgDrawing: {
                      type: "STRING",
                      description: "Anpassad SVG-kod för begreppet.",
                    },
                  },
                  required: ["topics"],
                },
              },
            ],
          },
        ],
      },
    };

    try {
      this.webSocket.send(JSON.stringify(setupMessage));
      this.logGeminiEvent("setup.sent");
      this.updateDiagnosticStatus(`Gemini Live ansluten (Klockslag: ${currentTimeStr})`);
    } catch (err) {
      console.error("Kunde inte skicka setup till Gemini Live:", err);
    }
  }

  private handleIncomingGeminiMessage(data: any): void {
    try {
      const msg = typeof data === "string" ? JSON.parse(data) : data;

      // 1. Spela upp ljudström från Gemini
      if (msg.serverContent?.modelTurn?.parts) {
        for (const part of msg.serverContent.modelTurn.parts) {
          if (part.inlineData?.data && part.inlineData.mimeType?.includes("audio")) {
            this.playPcm16AudioChunk(part.inlineData.data);
          }
        }
      }

      // 2. Hantera avbrott
      if (msg.serverContent?.interrupted) {
        this.stopAudioPlayback();
        this.logGeminiEvent("interrupted");
      }

      // 3. Hantera funktionsanrop (update_topic_zones)
      if (msg.toolCall?.functionCalls) {
        for (const call of msg.toolCall.functionCalls) {
          if (call.name === "update_topic_zones") {
            this.handleFunctionCallUpdateTopicZones(call.id, call.args);
          }
        }
      }
    } catch (err) {
      console.warn("Fel vid parsning av inkommande Gemini-meddelande:", err);
    }
  }

  private handleFunctionCallUpdateTopicZones(callId: string, args: any): void {
    this.logFunctionCall("update_topic_zones");

    if (args?.detectedObjects && Array.isArray(args.detectedObjects)) {
      this.setDetectedObjects(args.detectedObjects);
    }

    if (args?.topics && Array.isArray(args.topics)) {
      const speakerId = args.speakerId || "speaker-1";
      const topicText = args.topics.join(" ");

      const generatedTiles: AacTile[] = args.topics.map((t: string) => {
        const lower = t.toLowerCase();
        const matched = Object.entries(VOCABULARY_MAP).find(([k]) => lower.includes(k));
        const iconKey = matched ? matched[1].iconKey : "coffee";
        const speechText = matched ? matched[1].speechText : t;

        return {
          id: `gemini-tile-${speakerId}-${iconKey}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          iconKey,
          confidence: 0.9,
          isGroundTruth: true,
          speechText,
          enrichmentStage: args.svgDrawing ? "gemini_drawing" : "standard",
          customSvg: args.svgDrawing || undefined,
        };
      });

      if (this.options.onUtterance) {
        this.options.onUtterance({
          id: `live-utterance-${Date.now()}`,
          speakerId,
          text: topicText,
          tiles: generatedTiles,
          timestamp: Date.now(),
        });
      }
    }

    // Skicka svar på funktionsanropet tillbaka till Gemini
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      const responsePayload = {
        toolResponse: {
          functionResponses: [
            {
              id: callId,
              response: { result: "ok" },
            },
          ],
        },
      };
      this.webSocket.send(JSON.stringify(responsePayload));
    }
  }

  private closeWebSocket(): void {
    if (this.webSocket) {
      try {
        this.webSocket.close();
      } catch {}
      this.webSocket = null;
    }
  }

  public simulateUtterance(speakerId: SpeakerId, text: string): LiveUtteranceEvent | null {
    if (this.status !== "listening") {
      return null;
    }

    this.logPcmPacket();
    this.logGeminiEvent("audio.transcription");
    this.logFunctionCall("update_topic_zones");

    if (this.options.onActiveSpeakerChange) {
      this.options.onActiveSpeakerChange(speakerId);
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
        // Gradvis kontextupptrappning: kontrollera kamerasyn
        let enrichment: AacTile["enrichmentStage"] = "standard";
        let detectedObj: string | undefined = undefined;

        if (this.detectedObjects.some((obj) => obj.toLowerCase().includes(word))) {
          enrichment = "camera_enriched";
          detectedObj = word;
        }

        rawTiles.push({
          id: `live-tile-${speakerId}-${config.iconKey}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          iconKey: config.iconKey,
          confidence: config.baseConfidence,
          isGroundTruth: config.baseConfidence >= 0.8,
          speechText: config.speechText,
          enrichmentStage: enrichment,
          detectedObject: detectedObj,
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
