# Steg 2b: Evaluera Yttre Anpassning (TCK-015)

## Utvärdering av ändringen mot omgivande system och användarbehov

### 1. Påverkan på kognitiv belastning [RULE-001, RULE-006]
- Dubblettspärren eliminerar visuell röra och frustration orsakad av oavsiktliga multitryck.
- Den visuella responsen (att brickan markeras och läses upp) bibehålls så att användaren inte upplever att skärmen "inte tog klicket".

### 2. Ergonomi och responsivitet [RULE-006, RULE-015]
- Anpassningen i `UserControlZone` tar hänsyn till pekskärmars safe areas och säkerställer att alla knappar uppfyller WCAG AA och har en pekyta på minst 48px höjd.
- `MessageBar` anpassar storleken på brickorna dynamiskt baserat på antal valda element (1-2 stora, 3-4 medel, 5 kompakta) och tillåter smidig horisontell scroll om skärmen är extremt smal.

### 3. Akustisk miljö & Gemini Live turordning [SYSTEM-001, RULE-002, RULE-005]
- Mikrofondämpningen löser ett av de mest kritiska problemen i tvåvägs-ljudsystem: eko där AI-rösten eller den lokala syntesen "hör sig själv" via mikrofonen och utlöser ett avbrott (`interrupted`).
- Genom att dämpa mikrofonen under aktiv uppspelning skyddas både Geminis tolkning och användarens lugn.
