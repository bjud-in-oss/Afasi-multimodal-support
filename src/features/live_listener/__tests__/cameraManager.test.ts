import { describe, it, expect, vi, beforeEach } from "vitest";
import { CameraManager } from "../domain/cameraManager";

describe("CameraManager (Dynamisk Frekvens & Livscykel)", () => {
  let mockStop: any;
  let mockStream: any;

  beforeEach(() => {
    mockStop = vi.fn();
    mockStream = {
      active: true,
      getTracks: vi.fn().mockReturnValue([
        { kind: "video", stop: mockStop },
      ]),
    };
    if (typeof navigator === "undefined") {
      (globalThis as any).navigator = {} as any;
    }
    (navigator as any).mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue(mockStream),
    };
  });

  it("startar i inactive-status och kan starta kameran", async () => {
    const manager = new CameraManager();
    expect(manager.getStatus()).toBe("inactive");
    expect(manager.isActive()).toBe(false);

    const stream = await manager.start();
    expect(stream).toBe(mockStream);
    expect(manager.getStatus()).toBe("active");
    expect(manager.isActive()).toBe(true);
  });

  it("stänger av alla tracks och sätter status till inactive vid stop()", async () => {
    const manager = new CameraManager();
    await manager.start();

    manager.stop();

    expect(mockStop).toHaveBeenCalled();
    expect(manager.getStatus()).toBe("inactive");
    expect(manager.isActive()).toBe(false);
  });

  it("håller en kontrollerad singleton/instans och återanvänder aktiv ström", async () => {
    const manager = new CameraManager();
    const stream1 = await manager.start();
    const stream2 = await manager.start();

    expect(stream1).toBe(stream2);
    expect((navigator.mediaDevices.getUserMedia as any)).toHaveBeenCalledTimes(1);
  });

  it("beräknar intervall baserat på vilopuls (5.0s) och burst-läge (1.5s)", async () => {
    const manager = new CameraManager({
      idleIntervalMs: 5000,
      burstIntervalMs: 1500,
      burstDurationMs: 6000,
      minIntervalMs: 1000,
    });
    await manager.start();

    expect(manager.getNextIntervalMs()).toBe(5000);

    manager.triggerBurst("touch_interaction");
    expect(manager.isBurstActive()).toBe(true);
    expect(manager.getNextIntervalMs()).toBe(1500);
  });

  it("respekterar absolut rate limit (minst 1.0s mellan frames)", async () => {
    const manager = new CameraManager({
      minIntervalMs: 1000,
      idleIntervalMs: 5000,
      burstIntervalMs: 1500,
    });
    await manager.start();

    manager.recordFrameSent(Date.now() - 300);
    expect(manager.canSendFrameNow(Date.now())).toBe(false);

    expect(manager.canSendFrameNow(Date.now() + 800)).toBe(true);
  });

  it("detekterar rörelse via Pixel-Delta och triggar burst automatiskt", async () => {
    const manager = new CameraManager({
      pixelDeltaThreshold: 0.1,
      burstIntervalMs: 1500,
    });

    const isMotion = manager.evaluatePixelDelta(
      new Uint8ClampedArray([10, 10, 10, 255, 20, 20, 20, 255]),
      new Uint8ClampedArray([100, 100, 100, 255, 200, 200, 200, 255])
    );

    expect(isMotion).toBe(true);
    expect(manager.isBurstActive()).toBe(true);
  });
});
