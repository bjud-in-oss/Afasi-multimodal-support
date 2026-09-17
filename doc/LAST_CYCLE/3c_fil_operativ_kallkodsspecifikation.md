# Steg 3c: Fil-operativ källkodsspecifikation (Cykel 3)

## 1. Berörda filer i Fas 2 (Steg 4)
- `src/features/live_listener/domain/types.ts`
- `src/features/live_listener/domain/liveListenerService.ts`
- `src/features/live_listener/hooks/useLiveListener.ts`
- `src/features/live_listener/index.ts`
- `src/features/live_listener/__tests__/liveListenerService.test.ts`
- `src/features/aac_display/components/UserControlZone.tsx`
- `src/features/aac_display/hooks/useAacDisplay.ts`

## 2. Testfall som skrivs först (TDD)
1. `it("startar i IDLE-läge utan aktiv mikrofon")`
2. `it("begär muntligt samtycke vid första mikrofonaktivering")`
3. `it("genererar talarhändelser med korrekt zon-tillhörighet och konfidens")`
4. `it("respekterar paus och stopp")`
5. `it("integrerar sömlöst med adaptiva minnesvikter")`

BESLUT: GODKÄND
