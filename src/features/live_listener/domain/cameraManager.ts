import { CameraManagerConfig, CameraManagerInterface, CameraStatus } from "./types";

export class CameraManager implements CameraManagerInterface {
  private static instance: CameraManager | null = null;
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private status: CameraStatus = "inactive";

  private minIntervalMs: number;
  private idleIntervalMs: number;
  private burstIntervalMs: number;
  private burstDurationMs: number;
  private pixelDeltaThreshold: number;

  private lastFrameSentTimestamp = 0;
  private burstUntilTimestamp = 0;
  private previousImageData: Uint8ClampedArray | null = null;

  constructor(config?: CameraManagerConfig) {
    this.minIntervalMs = config?.minIntervalMs ?? 1000;
    this.idleIntervalMs = config?.idleIntervalMs ?? 5000;
    this.burstIntervalMs = config?.burstIntervalMs ?? 1500;
    this.burstDurationMs = config?.burstDurationMs ?? 6000;
    this.pixelDeltaThreshold = config?.pixelDeltaThreshold ?? 0.12;
  }

  public static getInstance(config?: CameraManagerConfig): CameraManager {
    if (!CameraManager.instance) {
      CameraManager.instance = new CameraManager(config);
    }
    return CameraManager.instance;
  }

  public async start(): Promise<MediaStream | null> {
    if (this.stream) {
      this.status = "active";
      return this.stream;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      this.status = "error";
      return null;
    }

    try {
      this.status = "requesting";
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 },
        },
      });

      this.stream = stream;
      this.status = "active";

      if (typeof document !== "undefined") {
        this.videoElement = document.createElement("video");
        this.videoElement.srcObject = stream;
        this.videoElement.playsInline = true;
        this.videoElement.muted = true;
        try {
          const playPromise = this.videoElement.play();
          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {});
          }
        } catch {
          // jsdom eller icke-implementerat play()
        }

        this.canvasElement = document.createElement("canvas");
        this.canvasElement.width = 64;
        this.canvasElement.height = 48;
      }

      return this.stream;
    } catch {
      this.status = "error";
      this.stream = null;
      return null;
    }
  }

  public stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    this.canvasElement = null;
    this.previousImageData = null;
    this.status = "inactive";
  }

  public captureFrameJpeg(): string | null {
    if (!this.isActive() || !this.videoElement) {
      return null;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = this.videoElement.videoWidth || 640;
      canvas.height = this.videoElement.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      return dataUrl.replace(/^data:image\/jpeg;base64,/, "");
    } catch {
      return null;
    }
  }

  public triggerBurst(_reason?: string): void {
    this.burstUntilTimestamp = Date.now() + this.burstDurationMs;
  }

  public isBurstActive(): boolean {
    return Date.now() < this.burstUntilTimestamp;
  }

  public getNextIntervalMs(): number {
    return this.isBurstActive() ? this.burstIntervalMs : this.idleIntervalMs;
  }

  public canSendFrameNow(currentTime: number = Date.now()): boolean {
    return currentTime - this.lastFrameSentTimestamp >= this.minIntervalMs;
  }

  public recordFrameSent(timestamp: number = Date.now()): void {
    this.lastFrameSentTimestamp = timestamp;
  }

  public evaluatePixelDelta(
    currentData: Uint8ClampedArray,
    prevData: Uint8ClampedArray
  ): boolean {
    if (currentData.length !== prevData.length || currentData.length === 0) {
      return false;
    }

    let diffSum = 0;
    const pixelCount = currentData.length / 4;

    for (let i = 0; i < currentData.length; i += 4) {
      const diff =
        Math.abs(currentData[i] - prevData[i]) +
        Math.abs(currentData[i + 1] - prevData[i + 1]) +
        Math.abs(currentData[i + 2] - prevData[i + 2]);
      diffSum += diff / (255 * 3);
    }

    const averageDiff = diffSum / pixelCount;
    if (averageDiff >= this.pixelDeltaThreshold) {
      this.triggerBurst("pixel_motion");
      return true;
    }
    return false;
  }

  public checkMotionPixelDelta(): boolean {
    if (!this.isActive() || !this.videoElement || !this.canvasElement) {
      return false;
    }

    try {
      const ctx = this.canvasElement.getContext("2d", { willReadFrequently: true });
      if (!ctx) return false;

      ctx.drawImage(
        this.videoElement,
        0,
        0,
        this.canvasElement.width,
        this.canvasElement.height
      );
      const imgData = ctx.getImageData(
        0,
        0,
        this.canvasElement.width,
        this.canvasElement.height
      );

      if (!this.previousImageData) {
        this.previousImageData = new Uint8ClampedArray(imgData.data);
        return false;
      }

      const hasMotion = this.evaluatePixelDelta(imgData.data, this.previousImageData);
      this.previousImageData.set(imgData.data);
      return hasMotion;
    } catch {
      return false;
    }
  }

  public isActive(): boolean {
    return this.status === "active" && !!this.stream;
  }

  public getStatus(): CameraStatus {
    return this.status;
  }
}
