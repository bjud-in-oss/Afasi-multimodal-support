# Affärsregler: aac_display

1. **Ingen text i användargränssnittet**: Inga textrubriker, menyer, titlar eller etiketter får renderas i DOM:en för användaren (`select-none`).
2. **Anti-Hallucination & Tröskelvärden**:
   - Konfidens < 0.50: Ytan ska lämnas helt tom.
   - Konfidens 0.50–0.79: Bilden renderas med ett transparent frågetecken (`?`).
   - Konfidens >= 0.80: Skarp bild utan frågetecken.
3. **Aktivt samtycke via klick**: Inget verbalt samtyckesmeddelande; klick på mikrofonknappen utgör aktivt samtycke och startar sessionen direkt.
4. **Dynamiska samtalszoner (Inga statiska scen-knappar)**: Statiska övningsknappar (Fika, Handla, Hälsa) är borttagna (`[SYSTEM-005]`). Alla samtalszoner och kategorier byggs 100 % dynamiskt av AI-agenten via `update_topic_zones`.
5. **Sticky Floor (`[RULE-001]`)**:
   - Vid beröring (`onTouchStart`, `onPointerDown`, `touchMove`, drag) pausas alla inkommande bakgrundsuppdateringar.
   - En 5000 ms Grace Period startas vid `onTouchEnd`/`onPointerUp`. Ny beröring nollställer timern.
   - Ett klick på `[Rensa]` nollställer budskapsraden och avbryter Grace Period omedelbart.
   - En 30-sekunders hard timeout återupptar bakgrundsuppdateringar automatiskt vid oavbruten beröring.
   - Skickar status till den delade laptopen som visar pulserande ram med texten "Kalle tänker... vänta.".
6. **Rullningsfri UI & Elastisk fyllnad (`[RULE-003]`)**:
   - Rotytan är låst till `h-screen max-h-screen overflow-hidden w-full bg-stone-100 flex flex-col lg:flex-row gap-5 p-4 select-none`.
   - Kontroll- och talarzoner har `h-full min-h-0 flex-col` för att eliminera rullningslister.
   - Ikoner fyller ytan elastiskt (`w-20 h-20` / `w-24 h-24`).
7. **Elastisk budskapsrad (`[RULE-006]`)**:
   - Rymmer max 5 symboler och en fast `GreenCheckButton`. Ikoner skalar elastiskt (`w-24` ned till `w-16`).
8. **Successiv inlärning & Frikopplad feedback**:
   - Grön bock bekräftar tolkning och tonar bort frågetecken.
   - Rött kryss avfärdar tolkning.
   - Direkt godkännande/avfärdande via mikrobrytare utan röstuppläsning.
9. **Adaptiv flertalarskalning (`[RULE-009]`, `[RULE-016]`)**:
   - Multipla talare visualiseras i symmetriska färgzoner.
   - Layouten växlar responsivt från vertikalt staplad på mobil till sida-vid-sida på laptop (`flex-col lg:flex-row`).
