# Steg 3b: Domänkontrakt och fraktal dokumentation (Cykel 3)

## 1. Domänens gränssnitt (`src/features/live_listener/`)
- `domain/types.ts`: Typdefinitioner för `ListenerStatus`, `LiveUtterance`, `SpeakerIdentification`.
- `domain/liveListenerService.ts`: Core service för samtycke, mikrofon och talarströmning.
- `hooks/useLiveListener.ts`: React-hook för gränssnittsintegration.
- `index.ts`: Publik export.

## 2. Samlokaliserad domändokumentation
- `src/features/live_listener/doc/BUSINESS_RULES.md`
- `src/features/live_listener/doc/INDEX.md`
