# Steg 2a: Förändra utåt (Vision) - TCK-014

## Yttre arkitektur & användarupplevelse
Ikonerna och samtalskontexten är afasideltagarens direkta förlängning i rummet:
1. **Intuitiv visuell representation**: När omgivningen pratar om att reparera, leta efter något, visa bilder eller lyssna på musik, ska skärmen visa tydliga, meningsfulla ikoner (skiftnyckel, förstoringsglas, bildikon, noter) istället för förvirrande frågetecken (`HelpCircle`).
2. **Direktkodad Tier 3 SVG [ADR-023]**: När Gemini Live genererar specialiserade eller kontextunika symboler som inte ingår i standardbiblioteket kan modellen skicka med en direktkodad SVG, vilken omedelbart renderas med perfekt skärpa och hög kontrast.
3. **Fullständig diagnostik i fält**: Forskare, logopeder och utvecklare som exporterar `diagnostics_60s.zip` får nu med användarens faktiska röst i `audio_user.pcm` och synkroniserad `audio_combined.pcm`, vilket möjliggör fullständig analys av samtalsinteraktioner och latenser.
4. **Tydlig samtalskontext**: Samtalszonen visar en verklig och levande ämnesbeskrivning (t.ex. "Planerar fika", "Pratar om reparation") istället för en mekanisk fallback "Kalle talar".
