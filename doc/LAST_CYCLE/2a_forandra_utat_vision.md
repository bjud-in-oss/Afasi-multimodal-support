# Steg 2a: Förändra utåt (Vision & Yttre Arkitektur) - TCK-006

## 1. Vision för flertalar-upplevelsen i afasigränssnittet
Ett flerpersonssamtal i en familj eller ett möte kan vara överväldigande för en person med afasi om gränssnittet blir trångt eller stroboskopiskt.
Genom adaptiv 2x2 bento/grid-skalning och färgkodade lugna teman ges användaren:
1. **Omedelbar rumslig orientering**: Varje person i rummet har en fast, dedikerad talarzon med ett personligt färg-DNA (`amber`, `emerald`, `sky`, `slate`, `violet`, `rose`).
2. **Kognitiv symmetri**: Oavsett om det är 1, 2, 3 eller 4 personer som talar, anpassas zonernas storlek automatiskt utan att användaren tappar överblicken eller behöver rulla.
3. **Mjuk fokusindikator**: Den som pratar för stunden indikeras med en mild, andande ring utan att de andra zonerna slocknar eller ändrar layout.

## 2. Arkitektoniska gränssnittsförändringar
- **`src/features/aac_display/domain/types.ts`**:
  ```ts
  export type ColorTheme = 'amber' | 'emerald' | 'sky' | 'slate' | 'violet' | 'rose';
  ```
- **`src/features/aac_display/components/SpeakerZoneView.tsx`**:
  Utöka temamappningen med `violet` och `rose` samt tillämpa dämpad transition-ring.
- **`src/features/aac_display/components/AacDisplay.tsx`**:
  Dynamisk grid-beräkning baserat på `speakerZones.length`:
  - $N = 1$: `grid-cols-1`
  - $N = 2$: `grid-cols-1 md:grid-cols-2`
  - $N \ge 3$: `grid-cols-1 md:grid-cols-2 lg:grid-cols-2` (eller 3-spalt vid bred bildskärm).
