# Steg 2e: Försoning och Förlikning (TCK-015)

## Förlikning av målkonflikter

### 1. Dubblettspärr vs avsiktlig upprepning
- **Målkonflikt**: Kan en användare någon gång vilja skriva "ja ja" eller "mer mer"?
- **Förlikning**: I AAC-miljöer för afasi med korta meningslängder (max 5 symboler) skapar intilliggande identiska symboler nästan uteslutande förvirring och ackustisk kakofoni vid uppläsning. Alternerande upprepning (Kaffe -> Mer -> Kaffe) tillåts fortfarande. Spärren gäller enbart direkt intilliggande dubbletter (`lastTile.iconKey === tile.iconKey && lastTile.speechText === tile.speechText`).

### 2. Mikrofondämpning vs avbrott från användaren (Barge-in)
- **Målkonflikt**: Om mikrofonen pausas under uppspelning, kan användaren då avbryta Gemini Live om de vill byta ämne?
- **Förlikning**: Avbrott sker i AAC-gränssnittet visuellt och taktilt genom att klicka på pekskärmen (t.ex. Rensa-knappen eller en ny bricka). Att klicka på pekskärmen avbryter omedelbart ljudet via `window.speechSynthesis.cancel()` och `pcmPlayer.interrupt()`. Detta återaktiverar omedelbart mikrofonsändningen utan fördröjning.

### 3. Responsiv bottenlayout vs skärmhöjd i landskapsläge
- **Målkonflikt**: I liggande läge (landscape) på mobil eller laptop kan en för hög bottenpanel ta för mycket vertikalt utrymme från samtalszonerna.
- **Förlikning**: På desktops/laptops (`lg:`) ligger `UserControlZone` i en vertikal högerspalt (`lg:w-80 lg:h-full lg:flex-col`). På mobil (`flex-row`) hålls höjden elastisk och kompakt (`min-h-[4.5rem]`) och använder `items-center` så att den inte stjäl onödig vertikal höjd.

MÄTTNAD: JA
