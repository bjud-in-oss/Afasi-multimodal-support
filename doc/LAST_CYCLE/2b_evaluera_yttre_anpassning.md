# Steg 2b: Evaluera yttre anpassning (Cykel 9 - TCK-010-011)

## 1. Bedömning av yttre anpassning och kognitiv tillgänglighet
- **Kognitiv och motorisk trygghet (Sticky Floor)**: Att gränssnittet fryser inkommande AI-uppdateringar under touch och i 5 sekunder efteråt eliminerar race conditions och frustration där knappar försvinner mitt under pekrörelsen.
- **Rullningsfrihet**: Genom att begränsa rotytan med `h-screen max-h-screen overflow-hidden` och använda `min-h-0 flex-col` rullas aldrig information utanför synfältet. Ikonernas ökade storlek (`w-20`/`w-24`) gör dem lätta att identifiera på avstånd.
- **Tyst observatör**: Genom att strikt förbjuda spontant tal från Gemini Live och begränsa svaren till icke-blockerande verktygsanrop med 2–3 kärnbegrepp upplevs AI:n som en stödjande assistent snarare än en påträngande samtalsledare.
- **Transparens och felsökning**: Att ha `diagnostics_60s.zip` med skärm, kamera, PCM-ljud och `events.json` möjliggör omedelbar djupdiagnostik utan att belasta användarytan.
