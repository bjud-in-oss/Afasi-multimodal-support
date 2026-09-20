import { describe, it, expect, beforeEach, vi } from "vitest";
import { DiagnosticRecorder } from "../domain/diagnosticRecorder";

describe("DiagnosticRecorder (60s RAM-buffert [SYSTEM-004])", () => {
  let recorder: DiagnosticRecorder;

  beforeEach(() => {
    recorder = new DiagnosticRecorder();
  });

  it("initieras med tom buffert", () => {
    expect(recorder.getEventCount()).toBe(0);
  });

  it("loggar tidsstämplade händelser med time-awareness och verktygsanrop", () => {
    recorder.logEvent("transcript", { text: "Hej, vill du ha kaffe?", speaker: "p1" });
    recorder.logEvent("tool_call", {
      tool: "update_topic_zones",
      args: {
        behavior: "NON_BLOCKING",
        tiles: [{ iconKey: "coffee", label: "Kaffe" }],
      },
    });

    expect(recorder.getEventCount()).toBe(2);
    const events = recorder.getEvents();
    expect(events[0].type).toBe("transcript");
    expect(events[1].type).toBe("tool_call");
    expect(events[1].data.args.behavior).toBe("NON_BLOCKING");
    expect(events[0].timestamp).toBeDefined();
    expect(events[0].isoTime).toBeDefined();
  });

  it("cirkulerar och behåller enbart de senaste 60 sekunderna", () => {
    const now = Date.now();
    // Skapa en gammal händelse för 70 sekunder sedan
    recorder.logEventWithTimestamp("old_event", { old: true }, now - 70000);
    // Skapa en färsk händelse för 10 sekunder sedan
    recorder.logEventWithTimestamp("recent_event", { recent: true }, now - 10000);

    recorder.pruneOldEvents(now);

    const events = recorder.getEvents();
    expect(events.length).toBe(1);
    expect(events[0].type).toBe("recent_event");
  });

  it("exporterar en zip-blob innehållande events.json", async () => {
    recorder.logEvent("system", { status: "recording_started" });
    const zipBlob = await recorder.exportZipBlob();

    expect(zipBlob).toBeInstanceOf(Blob);
    expect(zipBlob.size).toBeGreaterThan(0);
    expect(zipBlob.type).toBe("application/zip");
  });
});
