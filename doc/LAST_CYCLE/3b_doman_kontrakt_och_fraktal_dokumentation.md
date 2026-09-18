# Steg 3b: Domänkontrakt och fraktal dokumentation (Cykel 4)

## 1. Domän: `src/features/symbol_engine/`
- `domain/types.ts`: Typdefinitioner för ersättningskandidater och symbolmetadata.
- `domain/symbolEngineService.ts`: Servicelager för återgenerering, Gemini SVG/ikonval och adaptiv integrering.
- `hooks/useSymbolEngine.ts`: React-hook för tyst kurering.
- `index.ts`: Publik export.

## 2. Uppdateringar i `src/features/aac_display/`
- `AacTileItem.tsx`: Subtila mikro-kontroller (kryss och bock) för direkt tyst feedback.
- `useAacDisplay.ts`: Hanterar `handleDismissTileSilent` och `handleConfirmTileSilent` samt triggar asynkron återgenerering.
