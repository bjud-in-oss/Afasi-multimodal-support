# Steg 1a: Orientera

## 1. Problembeskrivning & Målbild
Implementera ett kompromisslöst textlöst AAC-gränssnitt (Maggan) för en afasideltagare:
- Dynamisk skärmpartitionering per identifierad talare (1–4 zoner) med vilsamt tomt utgångsläge.
- Strikt förankring och konfidensmodell: Inga hallucinationer. Konfidens < 0.5 lämnas tomt, 0.5–0.8 visar transparent frågetecken (`?`), > 0.8 visar ren bild.
- Scen-brickor i deltagarens egen zon för interaktiv dialogträning med låtsasdeltagare utan menyer.
- Tydligt feedbackreglage (grön bock / rött kryss) för successiv inlärning.

## 2. Inblandade domäner
- `src/features/aac_display/` (Primär domän)
- `src/shared/types/` (Gemensamma datakontrakt)

## 3. Tre fokuserade GROW-frågor mot risknoder
1. **Goal & State (Tillståndsrisk)**: Hur hanterar `aac_display` övergången mellan passivt viloläge, aktivt lyssnande och scenbaserade låtsassamtal så att zoner och bildbrickor hålls stabila utan plötsliga skiftningar?
2. **Options & Contract (Kontraktsrisk)**: Hur utformas datakontrakten för `AacItem`, `SpeakerZone`, `ConfidenceThreshold` och `FeedbackAction` så att gränsen mellan verifierad fakta och osäker gissning (frågetecken-överlägg) upprätthålls deterministiskt?
3. **Way Forward & Resilience (Resiliensrisk)**: Hur säkrar vi att låg konfidens (< 0.5) eller nätverkslatens konsekvent resulterar i vilsam tom yta snarare än felaktiga illustrationer eller textstörningar?

```json
{
  "status": "IN_PROGRESS",
  "current_domain": "aac_display",
  "next_step": "1b_kartlagga",
  "ticket_id": "TCK-002",
  "active_skill": "gemini-api-dev"
}
```
