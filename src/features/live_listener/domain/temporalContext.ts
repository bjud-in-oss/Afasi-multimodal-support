import { TemporalContext, DayPeriod } from "./types";

const DAYS_SV = [
  "Söndag",
  "Måndag",
  "Tisdag",
  "Onsdag",
  "Torsdag",
  "Fredag",
  "Lördag",
];

export function getDayPeriod(hours: number): DayPeriod {
  if (hours >= 6 && hours < 9) return "morgon";
  if (hours >= 9 && hours < 11) return "förmiddag";
  if (hours >= 11 && hours < 13) return "lunch";
  if (hours >= 13 && hours < 16) return "fika";
  if (hours >= 16 && hours < 18) return "eftermiddag";
  if (hours >= 18 && hours < 20) return "middag";
  if (hours >= 20 && hours < 23) return "kväll";
  return "natt";
}

export function getTemporalContext(date: Date = new Date()): TemporalContext {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const dayOfWeek = DAYS_SV[date.getDay()];
  const dayPeriod = getDayPeriod(hours);

  const localTimeFormatted = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;

  const summaryDescription = `${dayOfWeek} kl ${localTimeFormatted} (${dayPeriod})`;

  return {
    currentTimeIso: date.toISOString(),
    localTimeFormatted,
    dayOfWeek,
    dayPeriod,
    summaryDescription,
  };
}

export function formatTemporalInstruction(date: Date = new Date()): string {
  const ctx = getTemporalContext(date);
  return `[AKTUELL LOKAL TID & TEMPORAL KONTEXT]
- Datum & Klockslag: ${ctx.dayOfWeek} kl ${ctx.localTimeFormatted}
- Dygnsfas: ${ctx.dayPeriod}
- Instruktion: Anpassa samtalsförslag och symbolbrickor efter aktuell tidpunkt på dygnet (t.ex. frukost på morgonen, kaffe/fika på eftermiddagen, vila/medicin på kvällen).`;
}
