# Steg 3c: Fil-operativ Källkodsspecifikation (TCK-014)

## Filer och planerade ändringar för Fas 2

### 1. `src/features/aac_display/domain/types.ts`
- **Ändring:** Utöka `AacTile` interfacet:
  - `iconKey: string;` (stöd för öppna nycklar)
  - `svgContent?: string;` (Tier 3 direktkodad SVG)
  - Utöka `category` med `"action" | "object"`

### 2. `src/features/aac_display/components/AacTileItem.tsx`
- **Ändring:**
  - Importera ikoner från `lucide-react`: `Image as ImageIcon`, `Wrench`, `Sparkles`, `Search`, `Music`, `Phone`, `Car`, `Tv`, `Clock`, `Utensils`, `Bed`, `AlertTriangle`.
  - Uppdatera `renderIcon()`:
    1. Om `tile.svgContent` finns och inte är tomt: rendera SVG i en säker behållare med `w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 flex items-center justify-center`.
    2. Utöka switch-satsen med fall för:
       - `"images" | "image" | "photo"` -> `<ImageIcon ... />`
       - `"repair" | "wrench" | "fix" | "tool"` -> `<Wrench ... />`
       - `"generate" | "sparkles" | "magic"` -> `<Sparkles ... />`
       - `"search" | "find" | "look"` -> `<Search ... />`
       - `"music" | "song"` -> `<Music ... />`
       - `"phone" | "call"` -> `<Phone ... />`
       - `"car" | "drive"` -> `<Car ... />`
       - `"tv" | "television"` -> `<Tv ... />`
       - `"clock" | "time" | "wait"` -> `<Clock ... />`
       - `"food" | "eat" | "utensils"` -> `<Utensils ... />`
       - `"sleep" | "bed"` -> `<Bed ... />`
       - `"alert" | "warning"` -> `<AlertTriangle ... />`

### 3. `src/features/aac_display/components/MessageBar.tsx`
- **Ändring:**
  - Motsvarande utökade ikonmappning i `renderIcon()` och hantering av `tile.svgContent`.

### 4. `src/features/live_listener/domain/liveListenerService.ts`
- **Ändring:**
  - I `startMicrophoneStream()`: inuti `processor.onaudioprocess`:
    ```ts
    try {
      defaultDiagnosticRecorder.recordPcmChunk(bytes, false);
    } catch {}
    ```
  - I `UPDATE_TOPIC_ZONES_DECLARATION`: addera egenskapen `topic` till schemat.
  - I `COGNITIVE_OBSERVER_INSTRUCTION`: lägg till tydlig instruktion under "SYSTEM INSTRUCTIONS FOR TOOL CALLING" att alltid ange en kort, beskrivande svensk ämnesfras i `topic`.
  - I `handleIncomingFunctionCall`: vidarebefordra `svgContent: t.svgContent` i `parsedTiles`.

### 5. Enhetstester inför Fas 2
- `src/features/live_listener/__tests__/liveListenerService.test.ts`:
  - Verifiera att `recordPcmChunk(bytes, false)` anropas under mikrofonströmning.
  - Verifiera att `handleIncomingFunctionCall` sparar och vidarebefordrar `topic` och `svgContent`.
- `src/features/aac_display/components/__tests__/AacDisplay.test.tsx`:
  - Verifiera att brickor med `iconKey: "images"`, `"repair"`, `"generate"` och `"search"` inte renderar `HelpCircle` utan rätt ikoner.
  - Verifiera att en bricka med `svgContent` renderar den direktkodade SVG-grafiken.

BESLUT: GODKÄND
