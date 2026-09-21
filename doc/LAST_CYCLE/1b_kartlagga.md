# Steg 1b: Kartlägga (TCK-015)

```json
{
  "active_vectors": ["State"],
  "linear_fast_track": true,
  "ticket": "TCK-015",
  "domain": "aac_display"
}
```

## Svar på GROW-frågorna

### 1. State: Dubblettspärr i `useAacDisplay.ts`
- **Svar:**
  I `handleSelectTile()` i `src/features/aac_display/hooks/useAacDisplay.ts`:
  När användaren klickar på en `tile: AacTile`, undersöker vi det sista elementet i `prev.messageQueue`:
  ```ts
  const lastTile = prev.messageQueue[prev.messageQueue.length - 1];
  const isAdjacentDuplicate =
    lastTile &&
    (lastTile.id === tile.id ||
      (lastTile.iconKey === tile.iconKey &&
        lastTile.speechText.trim().toLowerCase() === tile.speechText.trim().toLowerCase()));

  const nextQueue =
    isAdjacentDuplicate || prev.messageQueue.length >= 5
      ? prev.messageQueue
      : [...prev.messageQueue, tile];
  ```
  Detta säkerställer:
  - Ingen dubbel symbol intill varandra i kön.
  - Max 5 symboler bibehålls strikt enligt [RULE-006 & ADR-019].
  - Användaren kan fortfarande välja olika symboler alternerande om så önskas (t.ex. Kaffe -> Bulle -> Kaffe).
  - Talsyntesen (`speakText(tile.speechText)`) och `setSelectedTile(tile)` körs fortfarande så att användaren känner att klicket registreras.

### 2. Contract: Responsiv Bottenlayout i `UserControlZone.tsx` och `MessageBar.tsx`
- **Svar:**
  - I `UserControlZone.tsx`:
    - Ta bort den hårda strypningen `max-h-24 sm:max-h-28` och ersätt med ett elastiskt intervall `min-h-[4.5rem] sm:min-h-[5rem] lg:min-h-0` med `h-auto`.
    - Ge knappar (`btn-clear-selection`, `feedback-confirm`, `feedback-reject`, `btn-toggle-mic`) tydliga flex-skydd (`shrink-0 sm:shrink` och `min-w-[3rem] sm:min-w-[3.5rem]`) så att de aldrig trycks ihop under 44-48px.
    - Lägg till mobil safe-area padding: `pb-[max(0.75rem,env(safe-area-inset-bottom))]` för moderna smartphones.
  - I `MessageBar.tsx`:
    - Ge containern `shrink min-w-0 max-w-full overflow-x-auto scrollbar-none py-1` så att symbolerna glider mjukt i horisontell led om skärmen är extremt smal (t.ex. äldre mobiler < 360px bredd), utan att bryta ut eller krocka med feedbackknapparna.

### 3. Effects: Lokal Mikrofondämpning och Turordning i `LiveListenerService`
- **Svar:**
  - I `src/features/live_listener/domain/liveListenerService.ts`:
    - Lägg till intern flagga `private isLocalSpeaking: boolean = false;` och metoderna:
      ```ts
      public setLocalSpeaking(speaking: boolean): void {
        this.isLocalSpeaking = speaking;
      }
      public isPlaybackActive(): boolean {
        return this.isLocalSpeaking || this.pcmPlayer.isPlaying();
      }
      ```
    - I `processor.onaudioprocess`:
      ```ts
      if (this.status !== "listening") return;
      if (this.isPlaybackActive()) {
        // Pausa mikrofonsändning vid aktiv uppspelning för att förhindra akustisk rundgång och avbrott [TCK-015, RULE-002]
        return;
      }
      ```
    - I `useAacDisplay.ts`:
      Uppdatera `speakText(text, volume)` så att den sätter `defaultLiveListener.setLocalSpeaking(true)` vid start och återställer till `false` vid `utterance.onend` eller `utterance.onerror` (med en säker timeout-fallback på beräknad talspråkslängd).
    - I `COGNITIVE_OBSERVER_INSTRUCTION` i `liveListenerService.ts`:
      Justera regeln för "SILENT OBSERVER MODE" så att ett tydligt undantag definieras för användarinitierade `text_impulse`:
      *"EXCEPTION: When receiving a direct user communication via \`text_impulse\`, you MAY respond with a single, very short, warm, and supportive spoken Swedish utterance (max 1 sentence) to acknowledge or reply to the user, after which you immediately return to silent observation."*
