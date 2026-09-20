# Steg 2e: Försoning och förlikning (Cykel 7 - TCK-008)

## 1. Försoning av arkitektoniska mål och krav
- **ADR-018 efterlevnad**: Alla tysta browsersyntes-fallbacks elimineras ur produktionskoden i `src/features/live_listener/domain/liveListenerService.ts`.
- **Fail Fast principen**: Eventuella anslutningsfel, ogiltiga nycklar eller hårdvaruundantag visas omedelbart i klartext i diagnostikraden.
- **TDD-förberedelse**: Enhetstesterna i `__tests__/liveListenerService.test.ts` uppdateras för att explicit verifiera att `speechSynthesis` inte anropas i produktion och att felkoder propageras rätt.

MÄTTNAD: JA
