# Steg 2b: Evaluera Yttre Anpassning (TCK-016)

## Utvärdering mot Yttre Anpassning och Systemkrav

### 1. Kognitiv Belastning och Afasiprinciper [RULE-001, RULE-002]
- **Krav:** Afasideltagaren får aldrig utsättas för oväntade auditiva stimuli eller kognitiv stress.
- **Utvärdering:** Genom att förbjuda allt spontant tal vid mikrofoninmatning minimeras sensorisk överbelastning. Skärmen förblir en ren visuell och taktil stödresurs.

### 2. Samtalsordning och Symmetri [RULE-005, RULE-009]
- **Krav:** Samtalsstödjaren och deltagaren måste kunna föra ett normalt samtal utan att tekniken stjäl fokus.
- **Utvärdering:** AI:ns roll degraderas till att enbart bistå med ord och bilder. Talrespons reserveras exklusivt för stunder då deltagaren aktivt tillkallat uppmärksamhet via Gröna Bocken.

### 3. Tekniska Begränsningar hos Multimodal LLM (Gemini Live)
- **Krav:** LLM:er som lyssnar på kontinuerligt ljud tenderar utan strikta systeminstruktioner att ibland tolka hummande, pauser eller frågor i rummet som direkta frågor till modellen.
- **Utvärdering:** Genom att instruera modellen att den *ENBART* får svara via funktionsanropet `update_topic_zones` så länge inmatningen sker via mikrofonljud, och att tal endast får förekomma vid explicit `text_impulse`, binds modellens beteende hårt mot rätt modalitetskanal.
