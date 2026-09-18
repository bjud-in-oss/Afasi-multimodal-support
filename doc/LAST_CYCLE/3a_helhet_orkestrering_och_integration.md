# Steg 3a: Helhet, orkestrering och integration (Cykel 4)

## 1. Systemöversikt & Dataflöde vid Mikro-Feedback
1. **Mikro-Avfärdande (Dissa)**:
   - Användaren trycker på mikro-krysset på en bricka i valfri zon.
   - Ingen talsyntes triggas.
   - Brickan tas omedelbart bort från zonens rendering.
2. **Minnesuppdatering**:
   - `defaultAdaptiveMemory.recordFeedback` anropas med `action: "reject"`.
   - Den inlärda konfidensen sänks drastiskt (< 0.50).
3. **Automatisk Återgenerering (`SymbolEngineService`)**:
   - `SymbolEngineService.requestReplacementTile` tar fram nästa bästa kandidat baserat på samtalskontexten och filtrerat mot `AdaptiveMemoryService`.
   - Om en lämplig ersättare hittas injiceras den mjukt i zonen.
4. **Parallell Bakgrundslyssning**:
   - Samtalslyssnaren i `live_listener` fortsätter att generera nya ämnen oberoende av manuella mikro-kureringshändelser.
