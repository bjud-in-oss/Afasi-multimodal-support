import { describe, it, expect, vi, beforeEach } from "vitest";
import { PcmPlayer } from "../domain/pcmPlayer";

describe("PcmPlayer (Web Audio & Avbrottshantering)", () => {
  let mockResume: any;
  let mockClose: any;
  let mockAudioContext: any;

  beforeEach(() => {
    mockResume = vi.fn().mockResolvedValue(undefined);
    mockClose = vi.fn().mockResolvedValue(undefined);

    mockAudioContext = {
      state: "suspended",
      sampleRate: 24000,
      resume: mockResume,
      close: mockClose,
      createBuffer: vi.fn().mockReturnValue({
        copyToChannel: vi.fn(),
        getChannelData: vi.fn().mockReturnValue(new Float32Array(100)),
      }),
      createBufferSource: vi.fn().mockReturnValue({
        buffer: null,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null,
      }),
      destination: {},
      currentTime: 0,
    };

    (globalThis as any).AudioContext = vi.fn().mockImplementation(() => mockAudioContext);
  });

  it("återupptar AudioContext vid anrop till resume() för autoplay-stöd", async () => {
    const player = new PcmPlayer();
    await player.resume();
    expect(mockResume).toHaveBeenCalled();
  });

  it("kan ta emot base64 PCM-chunk och schemalägga uppspelning", () => {
    const player = new PcmPlayer();
    // 4 bytes av PCM16 (2 samples)
    const base64Chunk = btoa("\x00\x00\x00\x00");
    player.enqueuePcmChunk(base64Chunk);

    expect(mockAudioContext.createBuffer).toHaveBeenCalled();
    expect(player.isPlaying()).toBe(true);
  });

  it("avbryter omedelbart schemalagda källor vid interrupt()", () => {
    const player = new PcmPlayer();
    const base64Chunk = btoa("\x00\x00\x00\x00");
    player.enqueuePcmChunk(base64Chunk);

    player.interrupt();
    expect(player.isPlaying()).toBe(false);
  });
});
