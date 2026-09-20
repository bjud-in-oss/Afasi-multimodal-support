import JSZip from "jszip";

export interface DiagnosticEvent {
  timestamp: number;
  isoTime: string;
  type: string;
  data: any;
}

export class DiagnosticRecorder {
  private events: DiagnosticEvent[] = [];
  private readonly bufferDurationMs = 60000; // 60 sekunders rullande buffert
  private pcmAudioChunks: { timestamp: number; data: Uint8Array; isIncoming: boolean }[] = [];
  private screenChunks: { timestamp: number; blob: Blob }[] = [];
  private cameraChunks: { timestamp: number; blob: Blob }[] = [];

  constructor() {}

  /**
   * Logga en händelse med aktuell tidsstämpel och ISO-tid (time-awareness).
   */
  logEvent(type: string, data: any): void {
    const now = Date.now();
    this.logEventWithTimestamp(type, data, now);
  }

  /**
   * Logga en händelse med explicit tidsstämpel.
   */
  logEventWithTimestamp(type: string, data: any, timestamp: number): void {
    const event: DiagnosticEvent = {
      timestamp,
      isoTime: new Date(timestamp).toISOString(),
      type,
      data,
    };
    this.events.push(event);
    this.pruneOldEvents(timestamp);
  }

  /**
   * Rensa bort händelser och data äldre än 60 sekunder.
   */
  pruneOldEvents(now = Date.now()): void {
    const cutoff = now - this.bufferDurationMs;
    this.events = this.events.filter((e) => e.timestamp >= cutoff);
    this.pcmAudioChunks = this.pcmAudioChunks.filter((c) => c.timestamp >= cutoff);
    this.screenChunks = this.screenChunks.filter((c) => c.timestamp >= cutoff);
    this.cameraChunks = this.cameraChunks.filter((c) => c.timestamp >= cutoff);
  }

  getEvents(): DiagnosticEvent[] {
    return [...this.events];
  }

  getEventCount(): number {
    return this.events.length;
  }

  /**
   * Spara ett PCM-ljudsegment i minnet (16kHz in eller 24kHz ut).
   */
  recordPcmChunk(data: Uint8Array, isIncoming: boolean, timestamp = Date.now()): void {
    this.pcmAudioChunks.push({ timestamp, data, isIncoming });
    this.pruneOldEvents(timestamp);
  }

  /**
   * Spara en videobit från skärmdelning.
   */
  recordScreenChunk(blob: Blob, timestamp = Date.now()): void {
    this.screenChunks.push({ timestamp, blob });
    this.pruneOldEvents(timestamp);
  }

  /**
   * Spara en videobit från kamera.
   */
  recordCameraChunk(blob: Blob, timestamp = Date.now()): void {
    this.cameraChunks.push({ timestamp, blob });
    this.pruneOldEvents(timestamp);
  }

  /**
   * Exporterar hela 60s RAM-bufferten till en nedladdningsbar ZIP-fil (`diagnostics_60s.zip`).
   */
  async exportZipBlob(): Promise<Blob> {
    this.pruneOldEvents();
    const zip = new JSZip();

    // 1. events.json med all tidsstämplad aktivitet och verktygsanrop
    const eventsJson = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        bufferDurationMs: this.bufferDurationMs,
        eventCount: this.events.length,
        events: this.events,
      },
      null,
      2
    );
    zip.file("events.json", eventsJson);

    // 2. Metadata
    zip.file(
      "metadata.json",
      JSON.stringify(
        {
          system: "AAC Cognitive Observer Agent",
          architecture: "Gemini 3.8 Live & React",
          audioInFormat: "16kHz PCM Raw",
          audioOutFormat: "24kHz PCM Raw",
          eventsLogged: this.events.length,
          pcmChunksRecorded: this.pcmAudioChunks.length,
        },
        null,
        2
      )
    );

    // 3. Om PCM-ljud finns samlat, slå ihop och spara
    if (this.pcmAudioChunks.length > 0) {
      let totalBytes = 0;
      for (const chunk of this.pcmAudioChunks) {
        totalBytes += chunk.data.length;
      }
      const combinedPcm = new Uint8Array(totalBytes);
      let offset = 0;
      for (const chunk of this.pcmAudioChunks) {
        combinedPcm.set(chunk.data, offset);
        offset += chunk.data.length;
      }
      zip.file("audio_combined.pcm", combinedPcm);
    }

    // 4. Skärm- och kamerainspelningar om tillgängliga
    if (this.screenChunks.length > 0) {
      const screenBlobs = this.screenChunks.map((c) => c.blob);
      const combinedScreen = new Blob(screenBlobs, { type: "video/webm" });
      zip.file("screen_recording.webm", combinedScreen);
    }

    if (this.cameraChunks.length > 0) {
      const cameraBlobs = this.cameraChunks.map((c) => c.blob);
      const combinedCamera = new Blob(cameraBlobs, { type: "video/webm" });
      zip.file("camera_recording.webm", combinedCamera);
    }

    return await zip.generateAsync({ type: "blob" });
  }

  /**
   * Hjälpmetod för att trigga webbläsarnedladdning av diagnostics_60s.zip.
   */
  async triggerDownload(): Promise<void> {
    const blob = await this.exportZipBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diagnostics_60s_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const defaultDiagnosticRecorder = new DiagnosticRecorder();
