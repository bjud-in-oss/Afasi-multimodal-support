# Steg 3c: Fil-operativ källkodsspecifikation

## 1. Berörda filer i Fas 2 (Steg 4)
- `src/features/aac_display/domain/types.ts`
- `src/features/aac_display/hooks/useAacDisplay.ts`
- `src/features/aac_display/components/AacTileItem.tsx`
- `src/features/aac_display/components/SpeakerZoneView.tsx`
- `src/features/aac_display/components/UserControlZone.tsx`
- `src/features/aac_display/components/AacDisplay.tsx`
- `src/features/aac_display/components/__tests__/AacDisplay.test.tsx`
- `src/features/aac_display/index.ts`
- `src/App.tsx`

## 2. Testfall som skrivs först (TDD)
1. `it("börjar med tomma samtalszoner utan text eller hallucinerade bilder")`
2. `it("filtrerar bort förslag med konfidens under 0.50 och lämnar zonen ren")`
3. `it("visar frågetecken-överlägg på brickor med konfidens mellan 0.50 och 0.79")`
4. `it("visar skarp bild utan frågetecken när konfidens är 0.80 eller högre")`
5. `it("aktiverar låtsasdeltagare när användaren trycker på en scen-bricka")`
6. `it("hanterar feedbackreglaget (bock och kryss) för att bekräfta eller avfärda gissningar")`

BESLUT: GODKÄND
