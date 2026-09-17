# Färdighetsstrategi: Google Gemini Skills (gemini-api-dev & gemini-live-api-dev)

## Frågeställning: Globala Skills vs. Lokala Skills i Repot?

### Slutsats: Det optimala är att installera dem globalt via `npx skills` OCH spegla dem lokalt i repot (`doc/skills/`).

Följande skills är konfigurerade för detta projekt:
1. **`gemini-api-dev`**: Utveckling mot Google Gemini API med det moderna `@google/genai` TypeScript SDK:et (text, bild, video, streaming, structured output, function calling).
2. **`gemini-live-api-dev`**: Realtidsapplikationer med dubbelriktad strömning (Gemini Live API 3.8 över WebSockets, VAD, audio/video).

---

### Hur de installeras och synkas:
```bash
npx skills add google-gemini/gemini-skills --skill gemini-api-dev --global
npx skills add google-gemini/gemini-skills --skill gemini-live-api-dev --global
```

### Arkitekturfördelar:
1. **Global tillgänglighet**: Tillgängliga för utvecklingsagenter över hela maskinen/containern via `~/.agents/skills/`.
2. **Hermetisk stabilitet**: Kopior finns i `doc/skills/gemini-api-dev/` och `doc/skills/gemini-live-api-dev/` för offline-stabilitet utan externa nätverksberoenden vid körtid.
3. **Exkluderade föråldrade färdigheter**: Tidigare katalog `doc/skills/mattpocock` har exkluderats vid kloning och ersatts av dessa officiella Google Gemini-färdigheter.
