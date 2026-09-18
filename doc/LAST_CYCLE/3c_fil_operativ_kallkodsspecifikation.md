# Steg 3c: Fil-operativ källkodsspecifikation (Cykel 4)

## 1. Nya och ändrade filer i Fas 2 (Steg 4)
- `src/features/symbol_engine/domain/types.ts`
- `src/features/symbol_engine/domain/symbolEngineService.ts`
- `src/features/symbol_engine/index.ts`
- `src/features/symbol_engine/__tests__/symbolEngineService.test.ts`
- `src/features/aac_display/components/AacTileItem.tsx`
- `src/features/aac_display/components/SpeakerZoneView.tsx`
- `src/features/aac_display/hooks/useAacDisplay.ts`
- `src/features/aac_display/components/__tests__/AacDisplay.test.tsx`

## 2. Testfall som implementeras i TDD
1. `it("avfärdar bricka tyst utan att tala vid klick på mikro-kryss")`
2. `it("bekräftar bricka tyst vid klick på mikro-bock")`
3. `it("genererar automatiskt en ersättningsbricka efter att en ruta dissats")`
4. `it("sparar dissad bricka med sänkt konfidens i adaptive_memory")`
5. `it("förhindrar att en nyligen dissad bricka föreslås som ersättare")`

BESLUT: GODKÄND
