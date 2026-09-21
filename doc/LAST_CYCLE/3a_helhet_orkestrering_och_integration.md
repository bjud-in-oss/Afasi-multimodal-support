# Steg 3a: Helhet, Orkestrering och Integration (TCK-016)

## Systemarkitektur och Samspel

```text
[Omgivningsljud i rummet: "Ska vi ta en fika nu?"]
               │
               ▼ (16kHz PCM ström)
   liveListenerService (Mikrofon aktiv)
               │
               ▼ WebSocket
     Gemini Live Session (3.8 Flash)
   - Strikt Tystnad vid ljud [RULE-002]
   - INGET TAL / INGEN LJUDUTMATNING
   - ENBART tool call: update_topic_zones
               │
               ▼ toolCall: update_topic_zones({ topic: "Fika", tiles: [Kaffe, Bulle] })
       AacDisplay (Uppdaterar bildbrickor tyst)
```

När användaren aktivt trycker på Gröna Bocken:
```text
[Användare trycker Grön Bock på [Kaffe]]
               │
               ├── 1. speakText("Kaffe") (Surfplattans röst)
               │      └── Mikrofondämpning aktiv [TCK-015]
               │
               └── 2. defaultLiveListener.sendTextImpulse("Kaffe")
                      │
                      ▼ text_impulse över WebSocket
            Gemini Live Session (Knapp-Undantag aktiveras)
            - Genererar max 1 kort svensk mening ("Självklart ordnar vi kaffe!")
            - Ljud spelas upp via pcmPlayer (Mikrofon förblir dämpad)
                      │
                      ▼
            Återgår direkt till 100% tystnad och enbart update_topic_zones
```
