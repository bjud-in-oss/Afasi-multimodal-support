# Steg 3b: Domänkontrakt & Fraktal Dokumentation (TCK-006)

## 1. Typ- och Kontraktspecifikation
```ts
// src/features/aac_display/domain/types.ts
export type ColorTheme = 'amber' | 'emerald' | 'sky' | 'slate' | 'violet' | 'rose';
```

## 2. Visuella regler & WCAG
- Alla teman har motsvarande `border`, `bg`, och `ring`-klasser.
- `AacDisplay` behåller textlöshet och minst 44px klickyta per knapp/bricka.
