# Affärsregler: symbol_engine

1. **Tyst mikro-feedback**: Ett klick på en förslagsrutas mikro-kryss tar omedelbart bort rutan utan att aktivera röst eller ljud.
2. **Omedelbar dämpning**: Dissade begrepp får omedelbart sin konfidens sänkt under 0.50 i `AdaptiveMemoryService`.
3. **Automatisk återgenerering**: Efter avfärdande hämtas en ny kandidat asynkront. Om ingen lämplig kandidat $\ge 0.50$ finns lämnas platsen ren och vilsam.
4. **Anti-hallucination**: Symboler med konfidens $< 0.50$ tillåts aldrig att visas.
