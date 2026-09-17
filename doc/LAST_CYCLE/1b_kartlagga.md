# Steg 1b: Kartlägga (Cykel 3)

## 1. Svar på GROW-frågorna

### Svar Fråga 1 (Goal & State)
Tillståndet styrs av `LiveListenerService` med följande faser:
- `IDLE`: Ingen mikrofon aktiv, ingen buffring.
- `AWAITING_CONSENT`: Muntlig fråga ställs högt till rummet via `SpeechSynthesis`.
- `LISTENING`: Mikrofonen är öppen och analyserar röstaktivitet (VAD).
- `PAUSED`: Tillfälligt pausat lyssnande.
Data skickas enbart till tolkning när tillståndet är `LISTENING`.

### Svar Fråga 2 (Options & Contract)
Ett gemensamt kontrakt definieras:
- `LiveUtterance`: `{ id: string; speakerId: "speaker-1" | "speaker-2"; text: string; tiles: AacTile[]; timestamp: number }`.
- `SpeakerDiarization`: Kartlägger ljudkällan till rätt visuell kolumn i gränssnittet.

### Svar Fråga 3 (Way Forward & Resilience)
Om mikrofonen nekas i webbläsaren eller om `getUserMedia` inte stöds i aktuell iframe växlar servicen automatiskt till en kontrollerad simuleringsmotor för övning utan att krascha eller visa förvirrande felmeddelanden i text.

## 2. Identifierade beroenden och aktiva vektorer
- Domän: `src/features/live_listener/`
- Konsument: `src/features/aac_display/`

```json
{
  "active_vectors": ["State"],
  "linear_track": true
}
```
