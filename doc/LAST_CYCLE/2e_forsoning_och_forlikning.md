# Steg 2e: Försoning och Förlikning (TCK-016)

## Förlikning av Målkonflikter

### 1. Strikt tystnad vs dialogmöjlighet
- **Målkonflikt:** Om modellen aldrig talar, förloras då möjligheten till interaktiv dialog?
- **Förlikning:** Nej, interaktiv dialog sker på användarens villkor. När användaren trycker på Gröna Bocken vill användaren ha en respons. Det är just då – och endast då – som modellen svarar med en kort, stödjande mening. Alla övriga dialoger sker mellan människorna i rummet, med systemet som diskret visuellt stöd.

### 2. Prompt-styrning vs deterministisk kodstyrning
- **Målkonflikt:** Räcker det att styra detta i systeminstruktionen, eller behövs ytterligare spärrar i kod?
- **Förlikning:** Systeminstruktionen för Gemini Live sätter modellens fundamentala persona och tool-calling-policy. I kombination med den nyligen införda mikrofondämpningen (TCK-015), där mikrofonen dämpas så att AI:n inte hör sig själv eller den lokala talsyntesen, ger detta en heltäckande och robust lösning.

### 3. Svarslängd och afasistöd
- **Målkonflikt:** Kan en för lång förklaring från AI:n skapa förvirring även efter ett knapptryck?
- **Förlikning:** Därför begränsar instruktionen svaret strikt till *maximalt en (1) kort mening*. Inga utläggningar, inga följdfrågor, inga långa monologer.

MÄTTNAD: JA
