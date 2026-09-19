# Steg 2e: Försoning och förlikning (Cykel 6 - TCK-006C)

## 1. Målkonflikter och deras förlikning
1. **Multimodal rikedom vs. Integritet & Resurskontroll**:
   - *Konflikt*: Kontinuerlig kameraströmning kan skapa oro kring integritet och dra onödig bandbredd/batteri.
   - *Förlikning*: Kameraströmmen styrs av en exklusiv singleton-instans som hårdvarumässigt stängs av (`track.stop()`) i samma millisekund som mikrofonen stängs av. Bildrutor tas i kontrollerad låg frekvens (1 fps eller vid talarväxling).
2. **Tvåvägsljud (Full Duplex) vs. Eko och självavbrott**:
   - *Konflikt*: Samtidig mikrofoninspelning och PCM16-högtalaruppspelning kan orsaka eko där modellen avbryter sig själv.
   - *Förlikning*: Web Audio och `getUserMedia` konfigureras med strikt hårdvaruekodämpning (`echoCancellation: true, noiseSuppression: true`), och vid serveravbrott (`interrupted: true`) töms PCM16-kön omedelbart.
3. **Live WebSocket-integration vs. Offline & TDD-resiliens**:
   - *Konflikt*: Enhetstester och miljöer utan API-nyckel kan inte köra mot riktiga WebSockets.
   - *Förlikning*: Arkitekturen separeras i modulära komponenter (`CameraManager`, `PcmAudioPlayer`, `GeminiLiveSession`) med tydliga gränssnitt så att enhetstester kan verifiera tillstånd, anrop och livscykel deterministiskt utan nätverksberoende.

MÄTTNAD: JA
