# Steg 3b: Domänkontrakt och fraktal dokumentation

## 1. Domänens gränssnitt (`src/features/aac_display/`)
- `components/AacDisplay.tsx`: Huvudkomponent för skärmuppdelning och zonrendering.
- `components/SpeakerZoneTile.tsx`: Enskild talarzon med bildbrickor och frågetecken.
- `components/UserControlZone.tsx`: Afasideltagarens zon med scen-brickor och feedbackreglage.
- `domain/types.ts`: Typdefinitioner för `AacTile`, `SpeakerZone`, `PracticeScenario`, `FeedbackState`.
- `hooks/useAacDisplay.ts`: Hook för zonhantering, konfidensfiltrering och scenväxling.
- `index.ts`: Publik export av domänen.

## 2. Samlokaliserad domändokumentation
- `src/features/aac_display/doc/BUSINESS_RULES.md`
- `src/features/aac_display/doc/INDEX.md`
- `src/features/aac_display/doc/UI_WORKFLOWS.md`
