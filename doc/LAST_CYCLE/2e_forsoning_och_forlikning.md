# Steg 2e: Försoning och Förlikning (TCK-014)

## Förlikning av målkonflikter

### 1. Säkerhet vid SVG-rendering vs enkelhet
- **Konflikt**: Direktkodad SVG kan innehålla osäkra element (t.ex. `<script>`) om den inte valideras.
- **Förlikning**: Vi renderar SVG med en begränsad container eller rensar/validerar grundläggande taggar så att endast rena vektorelement (`<svg>`, `<path>`, `<circle>`, `<rect>`, `<polygon>`) släpps igenom, eller renderar med strikt inline SVG-sanering utan externa skript.

### 2. Mikrofonprestanda vs inspelning i RAM
- **Konflikt**: Om ljudbearbetningen i `onaudioprocess` gör för mycket arbete kan ljudströmmen drabbas av buffert-underruns (glitches).
- **Förlikning**: `defaultDiagnosticRecorder.recordPcmChunk` gör enbart en snabb `slice(0)` av Uint8Array och sparar referensen i en array. Det tar mindre än 0.05 ms per 256 ms block och påverkar inte realtidsströmmen.

### 3. Ikonnamn från AI-modellen
- **Konflikt**: Gemini Live kan använda synonymer som t.ex. "image", "images", "photo", "picture" eller "repair", "fix", "tool", "wrench".
- **Förlikning**: Skapa normaliserad alias-hantering i switch-satsen i `AacTileItem` och `MessageBar` så att alla vanliga varianter mappar till samma distinkta Lucide-vektor.

MÄTTNAD: JA
