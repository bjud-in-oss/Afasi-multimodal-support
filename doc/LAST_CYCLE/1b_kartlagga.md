# Steg 1b: Kartlägga (TCK-016)

```json
{
  "active_vectors": ["State"],
  "linear_fast_track": true,
  "ticket": "TCK-016",
  "domain": "live_listener"
}
```

## Svar på GROW-frågorna

### 1. State: Tillståndsstyrning och Tystnad vs Textimpuls
- **Svar:**
  I `src/features/live_listener/domain/liveListenerService.ts`:
  Vi uppdaterar `COGNITIVE_OBSERVER_INSTRUCTION` under `## CORE BEHAVIORAL RULES & CONSTRAINTS` med följande två kristallklara och bindande principer:
  1. **STRICT SILENT OBSERVER MODE (100% Spoken Silence on Audio Input) [RULE-002, SYSTEM-009]:**
     - Modellen har ett absolut, kompromisslöst förbud mot att generera tal, röst eller verbala responser när den tar emot mikrofonavlyssning / omgivningsljud.
     - Modellen instrueras att ENBART generera icke-blockerande verktygsanrop (`update_topic_zones`) så länge den lyssnar på omgivningsljud.
     - Detta förhindrar all form av oavsiktlig inblandning, ekon eller spontana inpass från AI-assistenten.
  2. **BUTTON-TRIGGERED EXCEPTION FOR DIRECT USER COMMUNICATION [RULE-005, SYSTEM-001]:**
     - Modellen FÅR ENBART och UTESLUTANDE generera ett talat svar när den tar emot en skriven `text_impulse` från användaren (vilket sker när användaren bekräftar ett budskap via den Gröna Bocken i gränssnittet).
     - Talresponsen måste vara maximalt en (1) kort, varm, naturlig och uppmuntrande svensk mening (t.ex. "Självklart ordnar vi det!", "Det låter jättegott!").
     - Omedelbart efter att denna enda mening yttrats måste modellen återgå till 100 % strikt tystnad och uteslutande verktygsanrop.

### 2. Contract: Exponering och Validering av Systeminstruktionen
- **Svar:**
  - Vi gör `export const COGNITIVE_OBSERVER_INSTRUCTION` i `liveListenerService.ts` så att systeminstruktionen kan importeras och granskas direkt i testmiljön.
  - I `src/features/live_listener/__tests__/liveListenerService.test.ts` skapar vi dedikerade tester som:
    1. Verifierar att `COGNITIVE_OBSERVER_INSTRUCTION` innehåller det absoluta förbudet mot spontant tal vid mikrofoninmatning.
    2. Verifierar att den kräver att modellen ENBART genererar verktygsanrop (`update_topic_zones`) vid omgivningsljud.
    3. Verifierar att det explicita undantaget för `text_impulse` (Gröna Bocken) finns formulerat med max 1 kort svensk mening och krav på omedelbar återgång till tyst observation.

### 3. Effects: Akustisk och Kognitiv Resiliens
- **Svar:**
  - När användaren trycker på Gröna Bocken i `UserControlZone` exekveras `handleConfirm` i `useAacDisplay.ts`. Detta sänder `defaultLiveListener.sendTextImpulse(messageText)`.
  - Tack vare mikrofondämpningen från TCK-015 (`setLocalSpeaking(true)` och `pcmPlayer.isPlaying()`) är mikrofonen dämpad både när lokal talsyntes läser upp budskapet och när Gemini Live spelar upp sitt korta svar.
  - Genom att systeminstruktionen nu är 100 % tyst vid mikrofonljud finns ingen risk att Gemini Live någonsin bryter in spontant under pågående bordssamtal eller avbryter deltagaren.
