# Steg 1a: Orientera (Cykel 3)

## 1. Problembeskrivning & Målbild
Implementera domänen `src/features/live_listener/`:
- **Muntligt samtyckesflöde**: Innan mikrofonen börjar processa samtal i rummet ställer Gemini en tydlig muntlig fråga till deltagarna så att alla ger samtycke.
- **Röstströmning & Talardetektering**: Fångar upp talat ljud, särskiljer talare (Talare 1 vs Talare 2) och genererar strukturerade talhändelser.
- **Direktkoppling till Samtalszoner**: Levererar tolkade bildämnen direkt till `AacDisplay` med strikta konfidensvärden.

## 2. Inblandade domäner
- `src/features/live_listener/` (Primär domän)
- `src/features/aac_display/` (Konsumerande domän)
- `src/features/adaptive_memory/` (Minnesintegrering)

## 3. Tre fokuserade GROW-frågor mot risknoder
1. **Goal & State (Tillstånd)**: Hur modelleras tillståndsmaskinen för lyssnaren (`IDLE` -> `AWAITING_CONSENT` -> `STREAMING` -> `ANALYZING`) för att säkerställa att ingen ljuddata buffras innan samtycke bekräftats?
2. **Options & Contract (Kontrakt)**: Hur definieras `LiveListenerContract` och `LiveUtteranceEvent` för att garantera att varje tolkad symbol har en väldefinierad talartillhörighet och konfidenspoäng?
3. **Way Forward & Resilience (Resiliens)**: Hur hanteras nekad mikrofonbehörighet eller tysta miljöer utan att gränssnittet låser sig eller visar felmeddelanden i text?

```json
{
  "status": "IN_PROGRESS",
  "current_domain": "live_listener",
  "next_step": "1b_kartlagga",
  "ticket_id": "TCK-004",
  "active_skill": "gemini-live-api-dev"
}
```
