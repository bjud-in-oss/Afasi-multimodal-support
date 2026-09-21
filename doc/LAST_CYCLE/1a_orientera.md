# Steg 1a: Orientera (TCK-016)

## Ärende & Kontext
- **Ticket:** TCK-016
- **Typ:** Feature / Prompt / Resiliens
- **Domän:** `live_listener`
- **Beskrivning:** Strikt tyst observatör med knapp-undantag för Gemini Live (RULE-002, RULE-005, SYSTEM-001).

## Risknoder & GROW-frågor (State, Contract, Effects)

### 1. Risknod: State (Modalitetstillstånd & Avgränsning mellan Mikrofonström och Textimpuls)
- **Goal:** Garantera att Gemini Live-sessionen upprätthåller 100 % tystnad som absolut standardläge vid kontinuerlig mikrofonström (16kHz PCM), och att talsvar aktiveras uteslutande som en reaktion på en explicit användardriven `text_impulse` från Grön Bock.
- **Reality:** I `COGNITIVE_OBSERVER_INSTRUCTION` (under `src/features/live_listener/domain/liveListenerService.ts`) finns redan en grundläggande skrivning om tyst observation, men för att förhindra spontana hallucinationer eller verbala bekräftelser vid otydligt bakgrundsprat behövs ett vattentätt, kategoriskt förbud mot spontant tal vid mikrofoninmatning.
- **Options:**
  1. Skärpa formuleringen i `COGNITIVE_OBSERVER_INSTRUCTION` så att inkommande mikrofonljud explicit begränsas till att ENDAST få resultera i verktygsanropet `update_topic_zones` – aldrig tal eller ljud.
  2. Tydliggöra att modalitetsväxling till talat svenskt svar är strikt villkorat till mottagandet av en `text_impulse`-händelse från användarens aktiva val i gränssnittet.
- **Will:** Implementera en kategorisk och otvetydig tystnadsregel i prompten och knyta talrespons direkt till `text_impulse`.

### 2. Risknod: Contract (Systeminstruktionens Kontrakt & Undantagsdefinition)
- **Goal:** Säkerställa att systeminstruktionen har en kristallklar semantisk struktur: (a) Absolut förbud mot spontant tal vid omgivningsljud, (b) Krav på att ENBART generera verktygsanrop `update_topic_zones` vid mikrofoninmatning, (c) Ett strikt och snävt definierat undantag: vid mottagen `text_impulse` FÅR modellen generera max 1 kort, naturlig och uppmuntrande svensk mening innan den omedelbart återgår till tystnad.
- **Reality:** Instruktionen är privat i `liveListenerService.ts` och saknar direkt export för enhetstestning, vilket gör att regressioner i instruktionens formulering inte fångas i CI/testsviten.
- **Options:**
  1. Exportera `COGNITIVE_OBSERVER_INSTRUCTION` eller skapa en accessor-metod `getSystemInstruction()`.
  2. Strukturera om sektionen `1. SILENT OBSERVER MODE` med numrerade och fetmarkerade klausuler för "ABSOLUTE SILENCE ENFORCEMENT" och "STRICT BUTTON-TRIGGERED EXCEPTION".
- **Will:** Exportera `COGNITIVE_OBSERVER_INSTRUCTION` och bygga stringenta påståenden i `liveListenerService.test.ts`.

### 3. Risknod: Effects (Akustisk Miljö & Kognitiv Trygghet för Afasideltagaren)
- **Goal:** Skydda afasideltagaren från att bli avbruten eller stressad av att en AI-röst spontant "lägger sig i" samtalet i rummet, samtidigt som deltagaren känner sig bekräftad och hörd när denne aktivt sänt ett meddelande med Gröna Bocken.
- **Reality:** Om en AI talar oombett uppstår förvirring kring vem som talar i rummet (deltagaren, samtalspartnern eller datorn). När deltagaren däremot trycker på Gröna Bocken har deltagaren tagit kommandot – då är en kort bekräftelse från AI:n ("Det ordnar vi!", "Gott med kaffe!") stödjande och naturlig.
- **Options:**
  1. Tillåt obegränsat svar vid knapptryck.
  2. Begränsa svaret strikt till max 1 kort svensk mening, med omedelbar återgång till tyst observation, i kombination med den befintliga mikrofondämpningen [TCK-015].
- **Will:** Låsa svaret till max 1 kort mening och verifiera att samverkan med mikrofondämpningen bibehåller total akustisk stabilitet.
