# Steg 1b: Kartlägga (Cykel 4)

## 1. Svar på GROW-frågorna

### Svar Fråga 1 (Goal & State)
Tillståndet för en bricka frikopplas:
- Förslagsrutorna (`AacTileItem`) utrustas med diskreta mikro-åtgärder: ett tyst avfärdande (kryss) och ett tyst godkännande (bock).
- Vid klick på mikro-avfärdandet filtreras brickan omedelbart bort från zonens `tiles`-array i React-state utan anrop till `speakText`.
- Den tömda platsen reserveras med en mjuk laddningsplatshållare tills ersättningsbrickan anländer.

### Svar Fråga 2 (Options & Contract)
`SymbolEngineService` definierar ett dedikerat kontrakt:
- `requestReplacementTile(zoneId: string, rejectedTile: AacTile, contextKey: string): Promise<AacTile | null>`.
- Metoden anropar `defaultAdaptiveMemory.recordFeedback` med `action: "reject"` så att det dissade begreppets inlärda vikt omedelbart sänks (< 0.50).
- Därefter söks nästa mest relevanta symbol (från kontextuella symbolkandidater eller Gemini) som har en konfidens $\ge 0.50$.

### Svar Fråga 3 (Way Forward & Resilience & Hybridkoppling)
Hybridkopplingen säkras genom att använda funktionella tillståndsuppdateringar (`setState(prev => ...)`) med unika brick-ID:n (`id`).
- Om bakgrundslyssnaren i rummet lägger till nya ämnen sker detta via append/merge utan att skriva över pågående ersättningar.
- Om ingen lämplig ersättningssymbol hittas förblir platsen ren och tom för att förhindra hallucinationer och bibehålla en lugn skärmbild.

## 2. Identifierade beroenden och aktiva vektorer
- Domän: `src/features/symbol_engine/`
- Konsumenter: `src/features/aac_display/`, `src/features/adaptive_memory/`

```json
{
  "active_vectors": ["State"],
  "linear_track": true
}
```
