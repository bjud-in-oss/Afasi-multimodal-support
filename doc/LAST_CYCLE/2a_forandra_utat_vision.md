# Steg 2a: Förändra utåt - Vision & Arkitektonisk anpassning (Cykel 7 - TCK-008)

## 1. Yttre arkitektonisk anpassning
I enlighet med **ADR-018** skall all produktionskod i `src/` arbeta uteslutande mot skarpa integrationer och rapportera eventuella problem och felkoder direkt i klartext utan dolda fejk- eller fallback-lager.

- **Avlägsnande av tyst webbtalsyntes**:
  Webbläsarens `window.speechSynthesis` avlägsnas fullständigt från `liveListenerService.ts`. Det finns ingen anledning att låtsas att appen talar när Gemini Live är den tänkta ljudkällan.
- **Fail Fast felrapportering**:
  När användaren klickar på mikrofonen eller godkänner samtycke:
  1. Om `GEMINI_API_KEY` saknas: Rapportera omedelbart `WS ERROR: 400 - Saknar API-nyckel (GEMINI_API_KEY saknas i miljö)` i diagnostikraden.
  2. Om WebSocket-anslutningen misslyckas: Rapportera den faktiska felkoden och meddelandet.
  3. Om kameraaktivering misslyckas: Rapportera `KAMERA-FEL: [detalj]` i diagnostikraden.
- **Isolerade tester**:
  Tester som verifierar samtyckesflöden kan fortsätta injicera spioner via `setSpeechSynthesizer`, men i produktion körs ingen syntetisk browser-röst.
