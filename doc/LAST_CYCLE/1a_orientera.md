# Steg 1a: Orientera (Cykel 4 - symbol_engine & aac_display)

## 1. Problembeskrivning & Målbild
Implementera mikro-feedback, tyst kurering och automatisk återgenerering av förslagsrutor:
- **Frikopplad feedback (Disso/Godkänn utan tal)**: Deltagaren ska kunna avfärda ("dissa") eller bekräfta enskilda förslagsrutor direkt på skärmen via subtila mikro-kontroller utan att aktivera talsyntes som läser upp begreppet högt.
- **Automatisk ersättning i realtid**: När en förslagsruta dissas töms den omedelbart, varpå systemet asynkront genererar eller hämtar ett nytt, mer relevant förslag till samma zon.
- **Minnesintegrering (`AdaptiveMemoryService`)**: Det dissade begreppet registreras omedelbart med sänkt konfidens (< 0.50) i adaptiva minnet så att AI:n inte föreslår samma felaktiga spår igen.
- **Sömlös hybridkoppling**: Den manuella kureringslogiken ska fungera parallellt med AI:ns automatiska bakgrundsgenerering från rummet utan race conditions eller visuellt flimmer.

## 2. Inblandade domäner
- `src/features/symbol_engine/` (Ny primär domän för dynamiska symboler och återgenerering)
- `src/features/aac_display/` (Konsumerande domän: brickor, mikro-knappar, zonhantering)
- `src/features/adaptive_memory/` (Minnesmotor: vikter och nedtoning)
- `src/features/live_listener/` (Bakgrundslyssnare i rummet)

## 3. Tre fokuserade GROW-frågor mot risknoder
1. **Goal & State (Tillstånd)**: Hur kopplas den frikopplade mikro-feedbacken till zon- och bricktillståndet så att en dissad ruta omedelbart töms i UI:t utan att aktivera talsyntes eller störa övriga rutor i zonen?
2. **Options & Contract (Kontrakt)**: Hur utformas kontraktet för `SymbolEngineService` så att en dissad symbol registreras i `AdaptiveMemoryService` med konfidens < 0.50 och initierar hämtning/generering av en ny lämplig symbol?
3. **Way Forward & Resilience (Resiliens & Hybridkoppling)**: Hur skyddas systemet mot race conditions när bakgrundslyssnaren i rummet uppdaterar samtalszoner samtidigt som användaren manuellt rensar eller godkänner rutor?

```json
{
  "status": "IN_PROGRESS",
  "current_domain": "symbol_engine",
  "next_step": "1b_kartlagga",
  "ticket_id": "TCK-005",
  "active_skill": "gemini-api-dev"
}
```
