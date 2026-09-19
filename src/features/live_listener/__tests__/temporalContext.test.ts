import { describe, it, expect } from "vitest";
import { getTemporalContext, formatTemporalInstruction } from "../domain/temporalContext";

describe("TemporalContext (Tidsmedvetenhet)", () => {
  it("genererar ett strukturerat tidsobjekt baserat på givet datum", () => {
    // 2026-09-19 kl 10:30 (förmiddag)
    const testDate = new Date("2026-09-19T10:30:00");
    const ctx = getTemporalContext(testDate);

    expect(ctx.localTimeFormatted).toBe("10:30");
    expect(ctx.dayPeriod).toBe("förmiddag");
    expect(ctx.dayOfWeek.toLowerCase()).toContain("lördag");
  });

  it("klassificerar dygnsperioder korrekt", () => {
    expect(getTemporalContext(new Date("2026-09-19T07:30:00")).dayPeriod).toBe("morgon");
    expect(getTemporalContext(new Date("2026-09-19T12:15:00")).dayPeriod).toBe("lunch");
    expect(getTemporalContext(new Date("2026-09-19T15:00:00")).dayPeriod).toBe("fika");
    expect(getTemporalContext(new Date("2026-09-19T18:30:00")).dayPeriod).toBe("middag");
    expect(getTemporalContext(new Date("2026-09-19T21:00:00")).dayPeriod).toBe("kväll");
    expect(getTemporalContext(new Date("2026-09-19T02:00:00")).dayPeriod).toBe("natt");
  });

  it("formaterar systeminstruktionsfragment med tidskontext", () => {
    const testDate = new Date("2026-09-19T15:00:00");
    const instruction = formatTemporalInstruction(testDate);

    expect(instruction).toContain("AKTUELL LOKAL TID");
    expect(instruction).toContain("15:00");
    expect(instruction).toContain("fika");
  });
});
