# Steg 1b: Kartlägga (TCK-014)

```json
{
  "active_vectors": ["State"],
  "linear_fast_track": true,
  "ticket": "TCK-014",
  "domain": "live_listener"
}
```

## Svar på GROW-frågorna

### 1. State (Mikrofonljud & RAM-buffert i DiagnosticRecorder)
- **Svar:** I `src/features/live_listener/domain/liveListenerService.ts`, inuti `startMicrophoneStream()`, skapas `bytes` från `new Uint8Array(pcm16.buffer)`. Direkt efter rad 431 anropar vi:
  ```ts
  defaultDiagnosticRecorder.recordPcmChunk(bytes, false);
  ```
  Detta fyller `userPcmChunks` i `diagnosticRecorder.ts`, vilket garanterar att `audio_user.pcm` och sammanfogade `audio_combined.pcm` genereras i zip-filen när användaren laddar ner diagnostik.

### 2. Contract (Ikonmappning, Tier 3 SVG & Topic i Declarations)
- **Svar:**
  1. I `src/features/aac_display/domain/types.ts`: Utöka `AacTile` så att `svgContent?: string;` ingår, och tillåt sträng/utökade ikonnycklar.
  2. I `src/features/aac_display/components/AacTileItem.tsx`:
     - Importera Lucide-ikoner: `Image as ImageIcon`, `Wrench`, `Sparkles`, `Search`, `Music`, `Phone`, `Car`, `Tv`, `Clock`, `Utensils`, `Bed`, `AlertTriangle`.
     - Om `tile.svgContent` finns: rendera en inline SVG med säkra dimensioner och `currentColor`.
     - Om `tile.iconKey` matchar ("images", "repair", "generate", "search" etc.): rendera respektive Lucide-ikon.
  3. I `src/features/live_listener/domain/liveListenerService.ts`:
     - Addera parametern `topic` i `UPDATE_TOPIC_ZONES_DECLARATION`.
     - Uppdatera `COGNITIVE_OBSERVER_INSTRUCTION` så att Gemini instrueras att alltid sätta en kort svensk sammanfattning i `topic`.
     - I `handleIncomingFunctionCall`: vidarebefordra `svgContent: t.svgContent`.

### 3. Resilience (Robusta fallbacks och prestanda)
- **Svar:**
  - Om `recordPcmChunk` skulle kasta ett oväntat fel (t.ex. RAM-allokeringsstrypning), fångas det i en `try-catch` så att Web Audio- och WebSocket-strömmen aldrig avbryts.
  - Ikonvisningen har kvar `HelpCircle` som sista fallback om varken SVG eller känd ikonnyckel finns.
