# Steg 3c: Fil-operativ Källkodsspecifikation (TCK-016)

## Källkodsändringar och Testspecifikation inför Fas 2

### 1. `src/features/live_listener/domain/liveListenerService.ts`
- Exportera `COGNITIVE_OBSERVER_INSTRUCTION` (`export const COGNITIVE_OBSERVER_INSTRUCTION = ...`).
- Uppdatera texten under `### 1. SILENT OBSERVER MODE ([RULE-002], [SYSTEM-009])`:
  ```markdown
  ### 1. SILENT OBSERVER MODE ([RULE-002], [SYSTEM-009])
  - **ABSOLUTE SPOKEN SILENCE DURING AUDIO INPUT:** You must NEVER generate spoken audio, voice, or verbal responses when processing incoming microphone audio or background conversation. Your default spoken output volume must be 100% silent.
  - **ONLY TOOL CALLS DURING PASSIVE LISTENING:** While listening to ongoing ambient conversation, you must communicate EXCLUSIVELY via non-blocking tool calls (\`update_topic_zones\`). Never generate text or speech in response to room conversation.
  - **STRICT EXCEPTION FOR DIRECT USER TEXT IMPULSE ([RULE-005], [SYSTEM-001]):** You are ONLY permitted to generate a spoken audio response when you receive an explicit written message via \`text_impulse\` (triggered directly by the user confirming a message on the AAC display with the Green Checkmark button).
  - **BREVITY & EMPATHY RULE:** When responding to a \`text_impulse\`, your spoken response must be a single, very short, warm, supportive, and natural Swedish sentence (maximum 1 sentence). Immediately after speaking this single sentence, you MUST return to 100% silent observer mode.
  - You do NOT transcribe word-for-word. You **DISTILL**.
  - Boil down long monologues or background conversation into a maximum of 2–3 high-priority, actionable visual concepts (keywords/symbols).
  ```

### 2. `src/features/live_listener/__tests__/liveListenerService.test.ts`
- Importera `COGNITIVE_OBSERVER_INSTRUCTION` från `../domain/liveListenerService`.
- Lägg till en testsvit under `describe("LiveListenerService - Strikt Tystnad och Knapp-Undantag [TCK-016, RULE-002, RULE-005, SYSTEM-001]", ...)`:
  1. `verifierar att systeminstruktionen föreskriver absolut talförbud vid inkommande mikrofonljud`:
     - Kontrollera att texten innehåller reglering mot spoken audio / verbal responses under audio input.
  2. `verifierar att systeminstruktionen föreskriver att modellen enbart får använda verktygsanrop (update_topic_zones) vid omgivningsljud`:
     - Kontrollera att "EXCLUSIVELY via non-blocking tool calls (`update_topic_zones`)" finns i instruktionen.
  3. `verifierar att systeminstruktionen har ett strikt knapp-undantag för text_impulse`:
     - Kontrollera att `text_impulse`, kravet på max 1 mening ("maximum 1 sentence"), svenskt tal och omedelbar återgång till tysthet är strikt definierade.

BESLUT: GODKÄND
