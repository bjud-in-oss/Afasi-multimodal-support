# Steg 2a: Förändra utåt - Vision & Arkitektonisk anpassning (Cykel 9 - TCK-010-011)

## 1. Yttre vision & Kognitiv upplevelse
Den yttre upplevelsen formas efter de kanoniska reglerna i `doc/AAC_COGNITIVE_RULES.md`:

1. **Rullningsfri och visuell ro (`[RULE-003]`)**:
   - Skärmen är helt befriad från rullningslister (`h-screen max-h-screen overflow-hidden select-none`). Inga element rullar bortom synfältet.
   - Ikoner fyller brickorna med hög synlighet och storlek (`w-20` / `w-24`).
   - Statiska testknappar har städats bort (`[SYSTEM-005]`); alla samtalsämnen genereras dynamiskt av AI:n i harmoni med stunden.

2. **Skyddat arbetsminne via Sticky Floor (`[RULE-001]`)**:
   - När användaren vidrör skärmen pausas alla inkommande bildförändringar så att brukaren inte tappar sitt fokus.
   - En 5-sekunders tidsfrist (Grace Period) ges efter avslutad beröring.
   - Den delade laptopen visar en pulserande ram runt deltagarens profil med texten `"Kalle tänker... vänta."` så att övriga deltagare i rummet vet att ett inlägg förbereds.
   - Ett tryck på `[Rensa]` släpper ordet fritt direkt, och en 30s säkerhetstimer förhindrar låsning vid oavsiktlig beröring.

3. **Tyst kognitiv observatör i rummet (`[RULE-002]`, `[SYSTEM-009]`)**:
   - Gemini Live iakttar samtalet tyst utan att bryta in med verbalt tal.
   - Den destillerar samtalets kärna till 2–3 visuella symboler och anropar icke-blockerande verktyget `update_topic_zones` (`behavior: "NON_BLOCKING"`).
   - Offentligt tal i rummet sker uteslutande när användaren godkänner meningen med den gröna bocken (`GreenCheckButton`).

4. **Klartextdiagnostik och 60-sekunders RAM-recorder (`[ADR-018]`, `[SYSTEM-004]`)**:
   - Om API-nyckel saknas visas `"SAKNAR API-NYCKEL (VITE_GEMINI_API_KEY)"` direkt i diagnostikraden.
   - En rullande 60-sekunders inspelningsbuffert kan laddas ned som `diagnostics_60s.zip` via den dolda diagnostikpanelen.
