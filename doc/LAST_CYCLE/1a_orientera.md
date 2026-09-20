# Steg 1a: Orientera (Cykel 10 - TCK-013: Elastisk Budskapsrad, Offentlig Röst & Post-Speech Reset)

## 1. Problembeskrivning & Målbild
Implementera den kompletta Budskapsraden (Message Bar) och integrera den med Offentlig röst och Post-speech pause enligt `doc/AAC_COGNITIVE_RULES.md`:

1. **Elastisk Budskapsrad (`[RULE-006]`, `[ADR-019]`, `[RULE-003]`)**:
   - Bygga och uppdatera tillståndshanteringen i `useAacDisplay.ts` för en sekvens av valda symboler (`messageQueue`: max 5 symboler).
   - När afasideltagaren klickar på förslagsbrickor eller trygghetsbrickor adderas de till `messageQueue` (om `messageQueue.length < 5`).
   - Brickorna i budskapsraden skalar mjukt med CSS Flexbox (`w-24` ner till `w-16` vid 5 symboler) så att hela meningen alltid syns i sin helhet utan rullningslister (`[RULE-003]`).

2. **Punktkorrigering med Typ A Kryss (`[RULE-015]`, `[RULE-005]`)**:
   - Ett klick på en enskild symbol i budskapsraden provläser ordet privat via tyst lokal TTS (`[RULE-005]`).
   - Visar ett litet rött punktavfärdande `[x]` (Typ A kryss) ovanför/på den valda symbolen för att radera enbart den symbolen ur meningen utan att hela meningen raderas.

3. **Offentlig Röst & Gemini Live-impuls (`[RULE-005]`, `[SYSTEM-001]`)**:
   - Klick på den fasta Gröna Bocken till höger i budskapsraden/kontrollzonen läser upp hela den sammansatta meningen högt via enhetens högtalare (`messageQueue.map(t => t.speechText).join(" ")`).
   - Skickar samtidigt hela meningen tyst till Gemini Live via `defaultLiveListener.sendTextImpulse(...)` för att ge modellen full kognitiv kontext av vad afasideltagaren uttryckt.

4. **Post-Speech Reset & Andningspaus (`[RULE-008]`)**:
   - Direkt efter uppläsning inträder en 3000 ms vilsam andningspaus (`isBreathingPause: true`).
   - Skärmen och budskapsraden tonar mjukt ner, tömmer `messageQueue` och nollställer markerat läge så att deltagaren inte stressas av omedelbart nya krav.

## 2. Inblandade domäner
- `src/features/aac_display/` (`useAacDisplay.ts`, `UserControlZone.tsx`, `MessageBar.tsx`, `types.ts`, tester)
- `src/features/live_listener/` (`liveListenerService.ts` - `sendTextImpulse`)

## 3. Tre fokuserade GROW-frågor mot faktiska risknoder
1. **State & Flex-skalning (Risknod: State)**: Hur struktureras `messageQueue` i `useAacDisplay.ts` med tak på max 5 symboler och hur appliceras CSS Flexbox-skalningen (`w-24` -> `w-16`) i botten-dockan så att layouten förblir 100 % rullningsfri på både mobil och desktop?
2. **Contract & TTS-separation (Risknod: Contract/Effects)**: Hur separeras privat provlyssning (klick på enskild symbol i budskapsraden med Typ A kryss) från offentlig röst (klick på Grön Bock som läser upp hela meningen och anropar `sendTextImpulse`), och hur mockas/styrs ljudsyntesen säkert i enhetstester?
3. **Resilience & Timing (Risknod: Resilience)**: Hur styrs den 3000 ms andningspausen (`[RULE-008]`) med timer-rensning så att inga minnesläckor, race conditions eller oönskade tillståndsuppdateringar sker om komponenten avmonteras eller användaren klickar `[Rensa]`?

```json
{
  "status": "IN_PROGRESS",
  "current_domain": "aac_display",
  "next_step": "1b_kartlagga",
  "ticket_id": "TCK-013",
  "active_skill": "gemini-live-api-dev"
}
```
