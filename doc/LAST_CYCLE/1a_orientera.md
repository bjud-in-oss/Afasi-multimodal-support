# Steg 1a: Orientera (TCK-015)

## Ärende & Kontext
- **Ticket:** TCK-015
- **Typ:** Feature / UX / Resiliens
- **Domän:** `aac_display` / `live_listener`
- **Beskrivning:** Dubblettspärr i MessageBar, responsiv bottenlayout för mobila skärmar & lokal mikrofondämpning vid playback (RULE-002, RULE-005, RULE-006, SYSTEM-001).

## Risknoder & GROW-frågor (State, Contract, Effects)

### 1. Risknod: State (Dubblettspärr i MessageBar & Kö-integritet)
- **Goal:** Förhindra ackumulering av identiska symboler direkt efter varandra i `messageQueue` (t.ex. "Prata vidare Nikon Prata vidare Nikon Nikon") när användaren av misstag trycker upprepade gånger eller vid motoriska tremor, samtidigt som användaren fortfarande får auditiv bekräftelse för sitt tryck.
- **Reality:** I `useAacDisplay.ts` lägger `handleSelectTile()` alltid till klickad bricka i `messageQueue` så länge `messageQueue.length < 5`, oavsett vad föregående element i kön är.
- **Options:** 
  1. Kontrollera om sista elementet i `messageQueue` matchar den nyss klickade brickan (`last.id === tile.id || (last.iconKey === tile.iconKey && last.speechText === tile.speechText)`).
  2. Om dubblett: avstå från att lägga till i `messageQueue`, men sätt `selectedTile` och kör `speakText` för att ge taktil/auditiv feedback utan att förorena meningsbyggnaden.
- **Will:** Implementera strikt dubblettspärr i `handleSelectTile()` som spärrar intilliggande dubbletter men bibehåller val och talsyntesåterkoppling.

### 2. Risknod: Contract (Responsiv Bottenlayout & Touch Target-integritet)
- **Goal:** Garantera att `UserControlZone` och `MessageBar` på små och medelstora mobila skärmar bibehåller full peksäkerhet (minst 44-48px touch targets), aldrig trycks ihop vertikalt eller klipper ikoner, och respekterar safe-areas i mobila webbläsare.
- **Reality:** `UserControlZone.tsx` har en hård begränsning `max-h-24 sm:max-h-28` som vid 5 brickor i `MessageBar` tvingar ihop bekräftelse- och mikrofonknappar horisontellt och vertikalt.
- **Options:** 
  1. Justera höjd- och krympningsrestriktioner (`min-h-[4.5rem]`, borttagande av för snäva `max-h`, tillägg av `shrink-0` på knappar och responsiv `overflow-x-auto` vid trånga utrymmen).
  2. Skydda knapparna `btn-clear-selection`, `feedback-confirm`, `feedback-reject` och `btn-toggle-mic` från att kollapsa under minimumbredd.
  3. Säkerställa safe-area-padding i botten.
- **Will:** Uppdatera Tailwind-layouten i `UserControlZone.tsx` och `MessageBar.tsx` för optimal flexibilitet och ergonomi.

### 3. Risknod: Effects (Lokal Mikrofondämpning vid Playback & Röstsekvens)
- **Goal:** Förhindra akustisk rundgång, eko, dubbelläsning och oavsiktliga "interrupted"-avbrott i Gemini Live genom att automatiskt dämpa/pausa mikrofonens PCM-ström (16kHz) medan ljud spelas upp — vare sig det gäller lokal talsyntes (TTS) vid Grön Bock eller inkommande PCM-röst från Gemini Live. Samtidigt ska Gemini instrueras att ge en kort, naturlig muntlig respons i rummet vid mottagen `text_impulse`.
- **Reality:** Mikrofonens `onaudioprocess` skickar kontinuerligt data till Gemini Live oavsett om högtalarna spelar upp TTS eller Gemini-röst. Systeminstruktionen föreskriver också strikt "SILENT OBSERVER MODE" utan undantag för användarinitierade `text_impulse`.
- **Options:** 
  1. Implementera `isPlaybackActive()` i `LiveListenerService` som kontrollerar både `pcmPlayer.isPlaying()` och lokal syntesstatus (`isLocalSpeaking`).
  2. I `onaudioprocess`: avbryt mikrofonsändning om `this.isPlaybackActive()` är sant.
  3. Koppla `speakText()` i `useAacDisplay.ts` via talsyntesens livscykelhändelser (`onstart`, `onend`, `onerror`) till `defaultLiveListener.setLocalSpeaking(true/false)`.
  4. Uppdatera `COGNITIVE_OBSERVER_INSTRUCTION` så att Gemini Live vid en mottagen `text_impulse` tillåts ge en kort, varm svensk röstsekvens innan återgång till tyst observation.
- **Will:** Implementera heltäckande tillståndsdämpning och promptjustering.
