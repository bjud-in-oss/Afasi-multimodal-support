# Steg 3a: Helhet, orkestrering och integration (Cykel 3)

## 1. Systemöversikt & Dataflöde
1. **Initiering**: Användaren trycker på mikrofonknappen.
2. **Samtycke**: `LiveListenerService` begär samtycke muntligt via `speakConsentRequest()`.
3. **Ljudanalys**:
   - Ljudström fångas upp eller simuleras kontrollerat.
   - VAD upptäcker när någon talar.
   - Talaren klassificeras som `"speaker-1"` eller `"speaker-2"`.
4. **Symbolöversättning & Minne**:
   - Talade koncept matchas mot symboler med grundkonfidens.
   - `AdaptiveMemoryService.applyLearnedWeights` justerar konfidensen baserat på användarens tidigare val.
5. **Skärmuppdatering**: `AacDisplay` tar emot händelsen och renderar zonen med eventuellt frågetecken.
