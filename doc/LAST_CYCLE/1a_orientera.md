# Steg 1a: Orientera (Cykel 5 - TCK-006: aac_display)

## 1. Problembeskrivning & Målbild
Implementera adaptiv layout-skalning och harmonisk färgkodning för flertalar-rum (3+ talare) i det textlösa afasigränssnittet:
- **Adaptiv layout-skalning**: Gränssnittet ska dynamiskt och sömlöst skala om samtalszonerna när antalet aktiva talare växer från 1–2 till 3 eller fler (t.ex. 3–4 zoner). Brickornas storlek, touchytor och rutnätsdimensioner ska bevara full tillgänglighet (minst 44px träffyta) utan horisontellt spill eller visuell trängsel.
- **Harmonisk och distinkt färgkodning**: Utöka och förfina talarteman (`ColorTheme`) så att 3+ talare får konsekventa, dämpade och tydligt särskiljbara färgidentiteter (t.ex. sten, smaragd, bärnsten, himmel, viol/lavendel, salvia) som uppfyller WCAG AA och bevarar ett vilsamt lugn helt utan textetiketter.
- **Fokus och kognitiv avlastning vid flertalighet**: När flera personer talar i samma rum ska den aktiva talarens zon lyftas fram med en mjuk, icke-stressande fokusindikator, medan inaktiva talarzoner förblir lugna och läsbara för att undvika sensorisk överbelastning hos afasideltagaren.

## 2. Inblandade domäner
- `src/features/aac_display/` (Primär domän: `AacDisplay.tsx`, `SpeakerZoneView.tsx`, `UserControlZone.tsx`, `domain/types.ts`)
- `src/features/live_listener/` (Källa för flertaliga `SpeakerZone`-uppdateringar och talarväxling)
- `src/features/symbol_engine/` (Förslags- och ersättningsbrickor per zon)

## 3. Tre fokuserade GROW-frågor mot risknoder
1. **Goal & State (Tillstånd & Layout-responsivitet)**: Hur ska zon-layouten (`AacDisplay`) matematiskt och strukturellt anpassa sig (t.ex. 1–2 talare i flex-kolumner vs. 3–4 talare i en balanserad 2x2 responsive bento/grid) så att alla rutor behåller optimal storlek och vilsam symmetri oavsett skärmstorlek?
2. **Options & Contract (Färgkontrakt & Talardistinktion)**: Hur utökas `ColorTheme`-kontraktet i `types.ts` och dess Tailwind-mappningar i `SpeakerZoneView.tsx` för att garantera att 3 eller fler samtidiga talare automatiskt tilldelas distinkta, harmoniska och icke-mättade färgprofiler med stabil identitet över tid?
3. **Way Forward & Effects/Resilience (Kognitiv belastning & Aktiv talarfokus)**: Hur utformas den visuella aktivitetspulsen/fokusindikatorn så att en hastig talarväxling mellan 3+ deltagare i rummet inte skapar ett blinkande eller kognitivt uttröttande stroboskop för afasideltagaren?

```json
{
  "status": "IN_PROGRESS",
  "current_domain": "aac_display",
  "next_step": "1b_kartlagga",
  "ticket_id": "TCK-006",
  "active_skill": "gemini-api-dev"
}
```
