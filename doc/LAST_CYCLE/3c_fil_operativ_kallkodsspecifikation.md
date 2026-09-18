# Steg 3c: Fil-operativ källkodsspecifikation (TCK-006)

## 1. Målfiler för implementering i Fas 2 (Steg 4)
1. `src/features/aac_display/domain/types.ts`:
   - Utöka `ColorTheme` med `'violet' | 'rose'`.
2. `src/features/aac_display/components/SpeakerZoneView.tsx`:
   - Lägg till färgmappning för `violet` och `rose`.
   - Lägg till mjuk `ring-2 ring-opacity-60` och transition för aktiv talarzon.
3. `src/features/aac_display/components/AacDisplay.tsx`:
   - Dynamiskt anpassa `grid`-klasser baserat på antal talarzoner:
     - 1 talare: `grid-cols-1`
     - 2 talare: `grid-cols-1 md:grid-cols-2`
     - 3+ talare: `grid-cols-1 md:grid-cols-2 lg:grid-cols-2` eller `grid-cols-1 md:grid-cols-3` för breda vyer.
4. `src/features/aac_display/components/__tests__/AacDisplay.test.tsx`:
   - TDD-tester som verifierar rendering och adaptiv grid-klassning med 1, 2, 3 och 4 talarzoner samt rendering av nya färgteman.
