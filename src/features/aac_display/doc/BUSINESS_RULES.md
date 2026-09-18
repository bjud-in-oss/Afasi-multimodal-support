# Affärsregler: aac_display

1. **Ingen text**: Inga textrubriker, menyer, titlar eller etiketter får renderas i DOM:en för användaren.
2. **Anti-Hallucination & Tröskelvärden**:
   - Konfidens < 0.50: Ytan ska lämnas helt tom.
   - Konfidens 0.50–0.79: Bilden renderas med ett transparent frågetecken (`?`).
   - Konfidens >= 0.80: Skarp bild utan frågetecken.
3. **Muntligt samtycke**: Innan röstinspelning startas i rummet måste Gemini be om lov med tydlig röst.
4. **Scenval**: Låtsassamtal startas direkt via deltagarens scen-brickor utan modala dialoger.
5. **Successiv inlärning**:
   - Grön bock bekräftar tolkning och tonar bort frågetecken.
   - Rött kryss avfärdar tolkning och tar bort brickan från zonen.
6. **Frikopplad feedback**: Användaren kan godkänna eller avfärda enskilda brickor direkt via mikro-knappar utan att aktivera röstuppläsning.