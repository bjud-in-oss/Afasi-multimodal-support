# Steg 3a: Helhet, orkestrering och integration (Cykel 7 - TCK-008)

## 1. Orkestrering & Systemintegration
- **Tjänsteinstansiering**: När `LiveListenerService` konstrueras initieras `this.speechSynthesizer = () => {}`. Ingen bindning görs mot `window.speechSynthesis`.
- **Felorkestrering**:
  - Vid `initLiveWebSocket`: Validera förekomst av `GEMINI_API_KEY`. Vid avsaknad sätts diagnostikstatus omedelbart till `WS ERROR: 400 - Saknar API-nyckel (GEMINI_API_KEY saknas i miljö)`.
  - Vid `connect`-fel eller nätverksfel fångas fel i `onerror` och skickas till `handleWebSocketError`.
  - Vid stängning (`onclose`) rapporteras stängningskod via `handleWebSocketClose`.
  - Vid kamerastart sätts try-catch och eventuella fel rapporteras med prefixet `KAMERA-FEL:`.
- **Diagnostikvy**: `AacDisplay` / `UserControlZone` lyssnar på diagnostikhändelser och visar status i klartext.
