# Steg 3b: Domän, Kontrakt och Fraktal Dokumentation (TCK-014)

## Kontraktspecifikationer

### 1. AacTile Datamodell (`src/features/aac_display/domain/types.ts`)
```ts
export interface AacTile {
  id: string;
  iconKey: string;
  confidence: number;
  isGroundTruth: boolean;
  speechText: string;
  category?: "food" | "health" | "social" | "need" | "action" | "object";
  svgContent?: string; // [ADR-023 Tier 3] Direktkodad högkontrast-SVG
}
```

### 2. Gemini Live Function Declaration (`UPDATE_TOPIC_ZONES_DECLARATION`)
```json
{
  "name": "update_topic_zones",
  "description": "Tyst och icke-blockerande uppdatering av AAC-skärmens bildbrickor och samtalszoner. Destillerar pågående samtal till 2–5 kärnbegrepp.",
  "behavior": "NON_BLOCKING",
  "parameters": {
    "type": "OBJECT",
    "properties": {
      "participantId": {
        "type": "STRING",
        "description": "Unikt ID eller namn för deltagaren som talar (t.ex. 'Kalle', 'Anna', 'p1')."
      },
      "topic": {
        "type": "STRING",
        "description": "Kort, beskrivande svensk kontextfras för samtalsämnet (t.ex. 'Pratar om fika', 'Planerar middag', 'Diskuterar medicinering')."
      },
      "colorZone": {
        "type": "STRING",
        "description": "Färgzon för diarisering på den delade laptopen [RULE-009].",
        "enum": ["blue", "green", "orange", "purple"]
      },
      "behavior": {
        "type": "STRING",
        "description": "Garanterar icke-blockerande gränssnittsbeteende [RULE-002].",
        "enum": ["NON_BLOCKING"]
      },
      "tiles": {
        "type": "ARRAY",
        "description": "Lista med 2–5 destillerade bildbrickor/kärnbegrepp [SYSTEM-009].",
        "items": {
          "type": "OBJECT",
          "properties": {
            "iconKey": { "type": "STRING" },
            "label": { "type": "STRING" },
            "confidence": { "type": "NUMBER" },
            "svgContent": { "type": "STRING" }
          },
          "required": ["iconKey", "label"]
        }
      }
    },
    "required": ["participantId", "tiles", "behavior"]
  }
}
```

### 3. Diagnostic Recorder PCM-kontrakt (`SYSTEM-004`)
- `recordPcmChunk(chunk: Uint8Array, isModel: boolean)`:
  - `isModel === true`: Läggs till i `modelPcmChunks`.
  - `isModel === false`: Läggs till i `userPcmChunks`.
  - Båda tidsstämplas och skrivs till `audio_combined.pcm`.
