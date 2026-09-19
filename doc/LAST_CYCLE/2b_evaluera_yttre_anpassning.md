# Steg 2b: Evaluera yttre anpassning (Cykel 6 - TCK-006C)

## 1. Yttre utvärdering & gränssnittstest
- **Integritets- och tillståndsvalidering**: När användaren trycker på mikrofonsymbolen för att stoppa eller pausa lyssnandet garanterar `CameraManager` att `MediaStream.getTracks().forEach(track => track.stop())` exekveras synkront. Webbläsarens kamera- och mikrofonindikatorer släcks omedelbart.
- **Dynamisk kamerabelastning**:
  - Vid stationärt rum skickas en bildruta var 5:e sekund för att minimera CPU- och nätverkslast.
  - Vid talarväxling, skärmtryck eller rörelse framför kameran detekterad via Pixel-Delta intensifieras bildtagningen till var 1.5 sekund under 6 sekunder.
  - En hård spärr säkerställer att ingen bildruta skickas inom 1.0 sekund från den förra, vilket skyddar mot flodning av WebSocket-kanalen.
- **Web Audio tillförlitlighet**: Eftersom `audioContext.resume()` triggas direkt av användarens klick på mikrofonknappen hamnar `AudioContext` omedelbart i tillståndet `'running'` istället för att fastna i `'suspended'`.
- **Akustisk och kognitiv säkerhet**: Geminis genererade PCM16-tal ersätter webbläsarens syntetiska robotröst. Ljudet är naturligt, lugnt och avbrytbart. Vid minsta avbrott från användaren eller motparten tystnar Gemini direkt via `interrupted: true`.
- **Tidsmässig anpassning**: Tack vare tidsinjicering i sessionskontexten föreslås tidsrelevanta symboler (t.ex. kaffe och smörgås på förmiddagen, promenad på eftermiddagen, vila och medicin på kvällen).
- **Bakåtkompatibilitet och fallback**: Om WebSocket eller Gemini API-nyckel saknas i test- eller offline-miljö bibehålls deterministisk ordboksbaserad simulering så att användargränssnittet och testerna aldrig kraschar.
