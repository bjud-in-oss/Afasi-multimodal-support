# Steg 3a: Helhet, Orkestrering och Integration (TCK-015)

## Systemintegration och datatransporter

### 1. Interaktionsflöde vid symbolval och dubblettspärr
```text
Användare trycker på bricka [Kaffe]
  │
  ▼
useAacDisplay.ts -> handleSelectTile(tile)
  ├── 1. Kontrollera om sista brickan i messageQueue == tile
  │      ├── Ja (Dubblett): Hoppa över tillägg i messageQueue.
  │      └── Nej: Lägg till tile i messageQueue (max 5).
  ├── 2. setSelectedTile(tile)
  └── 3. speakText(tile.speechText) -> Taktil/auditiv bekräftelse.
```

### 2. Akustisk dämpning och talflöde
```text
Gröna Bocken trycks (handleConfirm)
  │
  ├── 1. speakText(mening)
  │      ├── defaultLiveListener.setLocalSpeaking(true)
  │      └── processor.onaudioprocess stänger av PCM-sändning (Dämpning)
  ├── 2. defaultLiveListener.sendTextImpulse(mening)
  │
TTS tystnar (utterance.onend)
  │
  ├── defaultLiveListener.setLocalSpeaking(false)
  │
Gemini Live svarar (kort röstsekvens på svenska)
  │
  ├── inkommande PCM -> pcmPlayer.enqueuePcmChunk()
  │      └── pcmPlayer.isPlaying() är SANT -> Mikrofonen förblir dämpad
  │
Gemini Live tystnar
  │
  └── pcmPlayer.isPlaying() blir FALSKT -> Mikrofonströmning återupptas automatiskt
```

### 3. Responsiv rendering i bottenzonen
```text
UserControlZone.tsx
  ├── Vänster: Rensa-knapp (RotateCcw) [shrink-0, min-w-[3rem]]
  ├── Mitten: MessageBar (horisontellt rullbar / elastisk) + Feedbackknappar (Check, X)
  └── Höger: Mikrofon/Samtyckesknapp (Mic/MicOff) + Diagnostikpunkt [shrink-0]
```
