# Steg 2e: Försoning och förlikning (Cykel 8 - TCK-008B)

## 1. Försoning av målkonflikter och protokollkrav
- **Integritet vs. Omedelbar tillgänglighet**: Konflikten mellan att inte tjuvlyssna och att ge snabb respons löses harmoniskt genom att användarens manuella klick på mikrofonknappen definieras som aktivt samtycke i Affärsregel 1.
- **Multimodal strömning vs. Verktygsanrop**: Genom att konfigurera verktyget med `behavior: "NON_BLOCKING"` enligt `SKILL.md` kan Gemini 3.8 Live köra asynkrona verktygsanrop i bakgrunden utan att PCM-ljud eller video hackar eller bryts.
- **Transkribering vs. Funktionsanrop (Dubletter)**: Transkriptionsströmmen (`inputAudioTranscription` / `outputAudioTranscription`) och funktionsanropet (`update_topic_zones`) avdupliceras via en gemensam metod med en rullande 4s-cache.
- **Injektion av textimpulser**: Text skickas uteslutande via `sendRealtimeInput({ text: ... })` vilket förhindrar de oönskade modellavbrott som `sendClientContent` med `turnComplete: true` annars orsakar.
- **Klartextdiagnostik**: Meddelandet `"SAKNAR API-NYCKEL (VITE_GEMINI_API_KEY)"` är fastlagt.

MÄTTNAD: JA
