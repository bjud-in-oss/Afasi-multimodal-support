# Steg 1b: Kartlägga (Cykel 5 - TCK-006: aac_display)

## 1. Besvarande av GROW-frågorna (Arkitektonisk syntes)

### Fråga 1 (Goal & State - Responsiv 2x2 grid-layout för 3+ talare):
- **1 talare**: Full bredd och balanserad höjd med centrerade, luftiga brickor.
- **2 talare**: 2 kolumner (desktop/tablet) eller 2 rader (mobil) med jämn fördelning.
- **3 talare**: Adaptiv 3-zonslayout (antingen 2 kolumner där en zon spänner över eller ett responsivt 3-kolumns/2x2-rutnät) med bibehållen kognitiv balans.
- **4+ talare**: Balanserad 2x2 grid (`grid-cols-1 md:grid-cols-2`) med optimerad padding och komprimerade men fullt tillgängliga brickdimensioner (minst 56px höjd och touchyta).

### Fråga 2 (Options & Contract - Utökat ColorTheme-kontrakt):
- Utökar `ColorTheme` i `src/features/aac_display/domain/types.ts` med:
  - `'violet'` (dämpad lavendel/viol)
  - `'rose'` (dämpad terrakotta/varm ros)
- Uppdaterar `themeStyles` i `SpeakerZoneView.tsx` med matchande mjuka bakgrunder, borders och subtila indikatorer som uppfyller WCAG AA och bevarar ett textlöst, harmoniskt visuellt lugn.

### Fråga 3 (Way Forward & Effects/Resilience - Dämpad aktivitetspuls):
- Snabba talarväxlingar hanteras med mjuk `transition-all duration-500 ease-out`.
- Aktiv talare framhävs via en dämpad yttre ring (`ring-2 ring-opacity-60`) och lätt upphöjd ton, utan flimrande eller abrupta kontrastskiften som kan skapa kognitiv trötthet.

---

## 2. Vektoranalys & Risknoder
- **`State`**: Responsiv zon-distribution vid $N \in [1, 6]$ talare.
- **`Contract`**: `ColorTheme` uppdaterad med bakåtkompatibilitet.
- **`Effects`**: Skonsam visuell prioritering av aktiv talare.

```json
{
  "active_vectors": ["State", "Contract"],
  "vector_count": 2,
  "execution_mode": "linear",
  "status": "COMPLETED",
  "next_step": "2a_forandra_utat_vision"
}
```
