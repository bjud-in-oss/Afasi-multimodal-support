# Steg 1a: Orientera (TCK-014)

## Ärende & Kontext
- **Ticket:** TCK-014
- **Typ:** Fix / Integration
- **Domän:** `live_listener` / `aac_display`
- **Beskrivning:** Ikonmapping, mikrofonljud i ZIP och dynamiska ämnesrubriker (ADR-023, SYSTEM-004, RULE-002).

## Risknoder & GROW-frågor (State, Contract, Resilience)

### 1. Risknod: State (Mikrofonbuffert & RAM-integritet i DiagnosticRecorder)
- **Goal:** Garantera att utgående mikrofonaudio (16kHz PCM från `startMicrophoneStream`) kontinuerligt lagras i RAM-bufferten via `defaultDiagnosticRecorder.recordPcmChunk(bytes, false)` så att `audio_user.pcm` och `audio_combined.pcm` genereras komplett i ZIP-exporten.
- **Reality:** I nuvarande `startMicrophoneStream` processas PCM-bytes och sänds till `liveSession`, men `recordPcmChunk` anropas aldrig för mikrofonen (enbart för inkommande modellaudio på rad 549).
- **Options:** Anropa `defaultDiagnosticRecorder.recordPcmChunk(bytes, false)` direkt efter `pcm16.buffer`-omvandlingen i `onaudioprocess`.
- **Will:** Injicera anropet synkront i `onaudioprocess` och validera via enhetstest i `liveListenerService.test.ts`.

### 2. Risknod: Contract (Ikonmappning, Tier 3 SVG & Ämnesrubrik i Schema)
- **Goal:** Tillhandahålla godkända Lucide-ikoner för AI-genererade ikonnycklar (t.ex. "images", "repair", "generate", "search", "music", "phone" m.fl.), stödja direktkodad `svgContent` (Tier 3 [ADR-023]), samt säkerställa att `topic` deklareras och instrueras i Gemini Live tool calling (`update_topic_zones`).
- **Reality:** `AacTileItem.tsx` saknar fall för dessa vanliga AI-termer och faller tillbaka till `HelpCircle`. `UPDATE_TOPIC_ZONES_DECLARATION` saknar `topic`-parametern i sitt JSON-schema trots att koden läser `args.topic`. `parsedTiles` vidarebefordrar inte `svgContent`.
- **Options:** 
  1. Utöka `AacTile["iconKey"]` och `AacTileItem` samt `MessageBar` med rika Lucide-ikoner (`ImageIcon`, `Wrench`, `Sparkles`, `Search` m.fl.).
  2. Implementera SVG-rendering i `AacTileItem` vid `tile.svgContent`.
  3. Addera `topic` i schema-deklarationen och skärp systemprompterna i `COGNITIVE_OBSERVER_INSTRUCTION`.
- **Will:** Implementera fullt kontraktstöd för alla tre punkter utan att bryta bakåtkompatibilitet.

### 3. Risknod: Resilience (Icke-blockerande fallback & Sanering av SVG)
- **Goal:** Gränssnittet får aldrig krascha vid okända ikonnycklar eller felaktigt formaterad `svgContent`, och WebSocket-strömmen får inte blockeras av inspelningsanrop.
- **Reality:** `AacTileItem` hanterar redan default-fall (`HelpCircle`), men om `svgContent` är ogiltig eller saknas behövs säker fallback.
- **Options:** Säkerställ att SVG-rendering fångas och skyddas, samt att default faller tillbaka på ren ikonografi vid behov.
- **Will:** Säkerställa isolerad och robust felhantering i renderingskedjan.
