# Steg 3b: Domänkontrakt och fraktal dokumentation (Cykel 8 - TCK-008B)

## 1. Domänkontrakt (`LiveListenerService`)

### Metodsignaturer & Egenskaper
- `startListening(): Promise<void>`:
  Sätter `consent.granted = true` direkt och aktiverar sessionen utan fördröjande röstmeddelanden.
- `confirmConsent(): Promise<void>`:
  Sätter `consent.granted = true` direkt och aktiverar sessionen.
- `sendTextPrompt(text: string): void`:
  Skickar text till Gemini via `this.liveSession.sendRealtimeInput({ text })` i enlighet med Gemini 3.8 Live-protokollet i `SKILL.md`.
- `handleIncomingText(text: string, speakerId?: string): void`:
  Matchar text mot symboler via symbolmotorn och skickar resulterande brickor till avdupliceraren.
- `handleIncomingFunctionCall(call: any): void`:
  Tolkar `update_topic_zones` och skickar de strukturerade brickorna till avdupliceraren samt returnerar bekräftelse till Gemini.
- `emitUtteranceWithDeduplication(speakerId: string, text: string, tiles: AacTile[]): void`:
  Central avduplicerare med en rullande `recentTilesCache: Map<string, number>` (4000ms TTL). Förhindrar att samma ikonnyckel visas flera gånger när transkription och funktionsanrop anländer parallellt.
- `updateDiagnosticStatus(status: string): void`:
  Uppdaterar diagnostikraden i realtid. Vid saknad nyckel sätts `"SAKNAR API-NYCKEL (VITE_GEMINI_API_KEY)"`.

## 2. Fraktal dokumentation
- `src/features/live_listener/doc/BUSINESS_RULES.md`:
  Regel 1 fastslår att användarens manuella klick på mikrofonknappen utgör giltigt aktivt samtycke (`consent.granted = true`) och startar lyssningen omedelbart utan syntetiska röstfördröjningar.
