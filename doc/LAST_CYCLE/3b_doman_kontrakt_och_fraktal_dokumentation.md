# Steg 3b: Domän, Kontrakt och Fraktal Dokumentation (TCK-016)

## Domänkontrakt: `live_listener`

### Systeminstruktionens Bindande Kontrakt (`COGNITIVE_OBSERVER_INSTRUCTION`)
Instruktionen formaliseras med följande explicita regler:

1. **Strikt Tystnad vid Mikrofonljud (`RULE-002`, `SYSTEM-009`)**:
   - `ABSOLUTE SPOKEN SILENCE`: Förbud mot att generera tal, röst eller verbala responser när inmatning sker via mikrofonljud.
   - `ONLY TOOL CALLS`: Under kontinuerlig avlyssning får modellen uteslutande generera verktygsanrop (`update_topic_zones`).

2. **Knapp-Undantag vid Textimpuls (`RULE-005`, `SYSTEM-001`)**:
   - `STRICT EXCEPTION FOR DIRECT USER TEXT IMPULSE`: Modellen har endast tillstånd att generera ett talat svar när den tar emot en skriven `text_impulse` från användaren via den Gröna Bocken.
   - `BREVITY CONSTRAINT`: Svaret måste vara högst 1 kort, naturlig och uppmuntrande svensk mening.
   - `IMMEDIATE RETURN TO SILENCE`: Direkt efter detta svar måste modellen återgå till absolut tystnad.

### Exponering för Testbarhet
- `COGNITIVE_OBSERVER_INSTRUCTION` exporteras från `src/features/live_listener/domain/liveListenerService.ts` så att testsviten i `liveListenerService.test.ts` kan validera kontrakten deterministiskt mot regressioner.
