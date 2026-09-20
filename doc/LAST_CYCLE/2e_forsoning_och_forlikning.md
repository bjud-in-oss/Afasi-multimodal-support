# Steg 2e: Försoning och Förlikning (Cykel 10 - TCK-013)

## 1. Identifierade Målkonflikter och Lösningar

### Konflikt 1: Enstaka Markering vs Sekvens i Budskapsraden
- **Dilemma**: Tidigare valdes 1 bricka (`selectedTile`) som sedan bekräftades eller avfärdades. Hur integreras detta med en flerords-budskapsrad (`messageQueue`)?
- **Försoning**: Klick på en samtalsbricka i `SpeakerZoneView` lägger till brickan i `messageQueue` (om `< 5`) och sätter den som senast vald. Gröna Bocken i budskapsraden bekräftar och läser upp hela `messageQueue` om den innehåller brickor, annars bekräftar den enskild vald bricka.

### Konflikt 2: Skärmhöjd på Mobil vs Utrymme för Budskapsrad
- **Dilemma**: `UserControlZone` är begränsad till `max-h-24 sm:max-h-28`. Ryms både kontrollknappar och budskapsrad horisontellt?
- **Försoning**: Ja. Layouten i botten-dockan organiseras i tre zoner:
  - Vänster: `[Rensa]`
  - Mitten: Elastisk `MessageBar` (1–5 brickor som skalar från `w-20` till `w-14`)
  - Höger: Feedback/Tala-knappar (`[✓]` och `[✕]` samt `[🎤 Mic]`).
  När `messageQueue` är tom visas en diskret, lugn platshållare eller de direkta kontrollknapparna, och när symboler läggs till expanderar budskapsraden elastiskt i mittsektionen.

### Konflikt 3: Andningspaus och Blockering
- **Dilemma**: Ska andningspausen (3000 ms) frysa appen eller vara icke-blockerande?
- **Försoning**: Den är icke-blockerande med mjuk visuell feedback. Om användaren trycker på `[Rensa]` under andningspausen avbryts den omedelbart och gränssnittet blir omedelbart redo.

## 2. Slutlig Avstämning
Alla kognitiva och tekniska målkonflikter är förlikade och arkitektoniskt harmoniserade.

MÄTTNAD: JA
