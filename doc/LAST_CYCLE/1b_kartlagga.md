# Steg 1b: Kartlägga

## 1. Svar på GROW-frågorna

### Svar Fråga 1 (Goal & State)
Tillståndet styrs av en ren reducer/hook (`useAacDisplay`) som separerar:
- `activeMode`: `'IDLE' | 'LIVE_CONVERSATION' | 'PRACTICE_SCENARIO'`
- `zones`: Array av `SpeakerZone` (varje zon har ett färgtema, talar-ID och lista av `AacTile`).
- `userZone`: Egen zon för afasideltagaren med scen-brickor och feedbackkontroller.
Övergångar sker med mjuka CSS-transitioner utan layout-hopp.

### Svar Fråga 2 (Options & Contract)
Ett `AacTile`-objekt kräver:
`{ id: string; iconKey: string; confidence: number; isGroundTruth: boolean; labelAlternative?: string }`.
Om `confidence < 0.5` filtreras brickan bort (tom yta).
Om `0.5 <= confidence < 0.8` sätts flaggan `needsClarification = true`, vilket renderar frågetecken-överlägget.
Om `confidence >= 0.8` visas brickan med full tydlighet.

### Svar Fråga 3 (Way Forward & Resilience)
En defensiv sanitizer-funktion rensar alla inkommande förslag. Om inga verifierade talade ord finns i bufferten eller om osäkerheten är stor förblir zonens innehåll tomt. Noll text renderas i DOM:en, inte ens `alt`-texter visas visuellt.

## 2. Identifierade beroenden och aktiva vektorer
- Domän: `src/features/aac_display/`
- Ikoner: `lucide-react` (SVG-vektorer med standardiserade storlekar och hög kontrast)
- Animationer: Tailwind transitions

```json
{
  "active_vectors": ["State"],
  "linear_track": true,
  "threshold_low": 0.5,
  "threshold_high": 0.8
}
```
