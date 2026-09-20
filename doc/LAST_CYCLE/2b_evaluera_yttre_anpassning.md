# Steg 2b: Evaluera yttre anpassning (Cykel 8 - TCK-008B)

## 1. Bedömning av yttre anpassning och tillgänglighet
- **Ergonomi för AAC-brukaren**: Att klicket direkt aktiverar lyssningen minskar kognitiv och motorisk belastning. Brukaren ser direkt att mikrofonen lyssnar och slipper vänta på fördröjande talsyntesfraser.
- **Protokollefterlevnad för Gemini 3.8 Live**: Att sätta `behavior: "NON_BLOCKING"` garanterar att Geminis Live API inte blockerar röstströmmen när bildbrickor skapas. Att använda `sendRealtimeInput` för text hindrar oönskade avbrott i modellens tal.
- **Avduplicering och visuell ro**: Genom att avduplicera symboler inom ett 4-sekundersfönster förhindras flimmer och redundanta AAC-brickor på skärmen när Gemini både transkriberar och genererar funktionsanrop.
- **Fail Fast & Diagnostik**: Texten `"SAKNAR API-NYCKEL (VITE_GEMINI_API_KEY)"` ger omedelbar felsökningsinformation utan att slutanvändaren eller utvecklaren behöver gissa varför sessionen inte ansluter.
