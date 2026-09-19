import { PcmAudioPlayerInterface } from "./types";

export class PcmPlayer implements PcmAudioPlayerInterface {
  private audioContext: AudioContext | null = null;
  private nextPlayTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private sampleRate = 24000;

  constructor(sampleRate = 24000) {
    this.sampleRate = sampleRate;
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined" && typeof globalThis === "undefined") {
      return null;
    }
    const AudioContextClass =
      (typeof window !== "undefined" && (window.AudioContext || (window as any).webkitAudioContext)) ||
      (globalThis as any).AudioContext;

    if (!AudioContextClass) return null;

    if (!this.audioContext) {
      this.audioContext = new AudioContextClass({ sampleRate: this.sampleRate });
    }
    return this.audioContext;
  }

  public async resume(): Promise<void> {
    const ctx = this.getAudioContext();
    if (ctx && ctx.state === "suspended") {
      await ctx.resume();
    }
  }

  public enqueuePcmChunk(base64Pcm: string): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const binaryString = atob(base64Pcm);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const pcm16 = new Int16Array(bytes.buffer);
      const numSamples = pcm16.length;
      if (numSamples === 0) return;

      const audioBuffer = ctx.createBuffer(1, numSamples, this.sampleRate);
      const channelData = audioBuffer.getChannelData(0);

      for (let i = 0; i < numSamples; i++) {
        channelData[i] = pcm16[i] / 32768.0;
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime;
      }

      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;

      this.activeSources.push(source);
      source.onended = () => {
        const index = this.activeSources.indexOf(source);
        if (index > -1) {
          this.activeSources.splice(index, 1);
        }
      };
    } catch {
      // Ignorera korrupt chunk
    }
  }

  public interrupt(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
      } catch {}
    }
    this.activeSources = [];
    if (this.audioContext) {
      this.nextPlayTime = this.audioContext.currentTime;
    }
  }

  public async close(): Promise<void> {
    this.interrupt();
    if (this.audioContext) {
      try {
        await this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
  }

  public isPlaying(): boolean {
    return this.activeSources.length > 0;
  }
}
