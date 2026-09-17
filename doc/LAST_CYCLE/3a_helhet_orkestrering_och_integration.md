# Steg 3a: Helhet, orkestrering och integration

## 1. Systemöversikt & Dataflöde
1. **Inmatningsfas**: Tal och scener genererar händelser till `useAacDisplay`.
2. **Filtreringsfas**: Varje förslag passerar konfidenskontrollen:
   - `< 0.50` -> Kastas (zon förblir tom).
   - `0.50 - 0.79` -> `showQuestionMark = true`.
   - `>= 0.80` -> Visas direkt.
3. **Visningsfas**: `AacDisplay` renderar zonerna i en horisontell/vertikal flex-grid.
4. **Interaktionsfas**:
   - Tryck på bildbricka -> triggar röstprediktion och talsyntes.
   - Tryck på scen-bricka -> aktiverar motsvarande låtsassamtal med virtuella samtalspartners.
   - Tryck på bock/kryss -> uppdaterar den lokala anpassningshistoriken.
