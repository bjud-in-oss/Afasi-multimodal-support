# Steg 3b: Domän, Kontrakt och Fraktal Dokumentation (TCK-015)

## Domänkontrakt och gränssnitt

### 1. `live_listener` Kontrakt
- **`LiveListenerService` Metoder**:
  - `public setLocalSpeaking(speaking: boolean): void`
    - Sätter status för om lokal talsyntes pågår.
  - `public isPlaybackActive(): boolean`
    - Returnerar `true` om antingen `this.isLocalSpeaking` är `true` eller `this.pcmPlayer.isPlaying()` är `true`.
- **Systeminstruktion (Gemini Live)**:
  - Uppdaterad `COGNITIVE_OBSERVER_INSTRUCTION` med tydligt undantag:
    *"EXCEPTION: When receiving a direct user communication via \`text_impulse\`, you MAY respond with a single, very short, warm, and supportive spoken Swedish utterance (max 1 sentence) to acknowledge or reply to the user, after which you immediately return to silent observation."*

### 2. `aac_display` Kontrakt
- **`useAacDisplay` Hook**:
  - `handleSelectTile(tile: AacTile): void`
    - Garanterar att två intilliggande identiska symboler inte kan ackumuleras i `messageQueue`.
  - `speakText(text: string, volume?: number): void`
    - Sätter talsyntesens livscykelhändelser så att `defaultLiveListener.setLocalSpeaking(true)` triggas vid start och `defaultLiveListener.setLocalSpeaking(false)` vid slut/fel.
- **Komponenter**:
  - `UserControlZone.tsx`: Säkrad med flex-shrink-skydd, adaptiv min-höjd och safe-area padding.
  - `MessageBar.tsx`: Säkrad med horisontell scroll-resiliens vid smala skärmbredder och skyddade ikonstorlekar.
