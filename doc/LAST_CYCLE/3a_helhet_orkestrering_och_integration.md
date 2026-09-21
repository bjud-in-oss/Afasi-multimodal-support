# Steg 3a: Helhet, Orkestrering och Integration (TCK-014)

## Arkitekturell översikt och dataintegration

```
+-----------------------------------------------------------------------------------+
| LiveListenerService                                                               |
|                                                                                   |
|  [getUserMedia 16kHz]                                                             |
|           |                                                                       |
|     onaudioprocess ---> recordPcmChunk(bytes, false) ---> DiagnosticRecorder      |
|           |                                                  (audio_user.pcm)     |
|           v                                                                       |
|     sendRealtimeInput (audio/pcm)                                                 |
|           |                                                                       |
|           v                                                                       |
|     Gemini Live WebSocket                                                         |
|           |                                                                       |
|           +---> FunctionCall: update_topic_zones({ topic, tiles: [iconKey, ...] })|
|           |                                                                       |
|           v                                                                       |
|     handleIncomingFunctionCall                                                    |
|           |                                                                       |
|           +---> vidarebefordrar topic & tiles (inkl. svgContent)                  |
|                                                                                   |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| AacDisplay & AacTileItem & MessageBar                                             |
|                                                                                   |
|  - AacTileItem renderar:                                                          |
|      1. tile.svgContent om definierat [ADR-023 Tier 3]                            |
|      2. Mappad Lucide-ikon: image, wrench, sparkles, search, music, etc.          |
|      3. HelpCircle som sista fallback om okänd symbol                             |
+-----------------------------------------------------------------------------------+
```

## Modulöverskridande integration
1. `types.ts`: Typdefinitionen för `AacTile` utökas med `svgContent?: string;`.
2. `liveListenerService.ts`: 
   - `startMicrophoneStream` anropar `recordPcmChunk(bytes, false)`.
   - `UPDATE_TOPIC_ZONES_DECLARATION` inkluderar `topic`.
   - `COGNITIVE_OBSERVER_INSTRUCTION` instruerar beskrivande svensk fras för `topic`.
   - `handleIncomingFunctionCall` mappar `svgContent: t.svgContent`.
3. `AacTileItem.tsx`:
   - Utökad ikonmappning för "images"/"image", "repair"/"wrench", "generate"/"sparkles", "search", "music", "phone", "car", "tv", "clock", "utensils", "bed", "alert".
   - Stöd för direktkodad `svgContent`.
4. `MessageBar.tsx`:
   - Motsvarande utökade ikonmappning så att symbolerna renderas identiskt i budskapsraden.
