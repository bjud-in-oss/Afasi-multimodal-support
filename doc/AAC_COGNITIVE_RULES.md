# AAC COGNITIVE & SYSTEM ARCHITECTURE SPECIFICATION
**Dokument-ID:** `doc/AAC_COGNITIVE_RULES.md`  
**Status:** Canonical / Master Specification  
**Målmiljö:** Web / Mobile / Gemini 1.5 & 3.8 Flash / React + Tailwind CSS / Shared Realtime DB  

---

## 1. KOGNITIVA CORE-PRINCIPER & INTERAKTION

### [RULE-001: STICKY_FLOOR]
* **SYFTE:** Bevara arbetsminne, eliminera race-conditions och förhindra kognitiv stress vid motorisk eller språklig tvekan.
* **CONDITION:** När `onTouchStart`, `onPointerDown`, `touchMove` eller drag-händelse detekteras inom `AacDisplay` eller `UserControlZone`.
* **ACTION:**
  1. Pausa omedelbart alla inkommande UI-uppdateringar från AI-agenten (`update_topic_zones`).
  2. Starta en osynlig 5000 ms Grace Period-timer vid `onTouchEnd`/`onPointerUp`. Om ny beröring sker inom 5000 ms nollställs timern.
  3. Skicka en websocket-impuls till laptop-projektionen som visar en pulserande ram runt deltagarens profil med texten `"Kalle tänker... vänta."`.
* **EARLY RELEASE:** Ett klick på knappen `[Rensa/Avbryt]` nollställer budskapsraden och dödar omedelbart den pågående 5000 ms Grace Period-timern så att ordet släpps fritt till rummet.
* **HARD TIMEOUT:** Om beröring pågår oavbrutet i > 30 000 ms (30 s) exekveras en säkerhets-release som återupptar bakgrundsuppdateringar för att förhindra permanent frysning vid oavsiktlig beröring.

### [RULE-002: OBSERVER_AGENT]
* **SYFTE:** Skapa en trygg, tyst och icke-intrusiv närvaro i rummet.
* **CONDITION:** Under löpande samtal mellan personer i rummet.
* **ACTION:**
  1. Gemini Live hålls 100 % tyst avseende röstutmatning (Mute/No Audio Output).
  2. Agenten analyserar kontinuerligt strömmande ljud/video och svarar BARA via tysta, icke-blockerande verktygsanrop (`update_topic_zones` deklarerat med `behavior: "NON_BLOCKING"`).
* **CONSTRAINT:** Gemini Live Voice får ENDAST aktiveras och tala högt i rummet när användaren aktivt trycker på `GreenCheckButton` (Gröna Bocken) i budskapsraden.

### [RULE-003: NO_SCROLL_UI]
* **SYFTE:** Eliminera "Ur syn, ur sinn"-problematik och förhindra finmotorisk överbelastning.
* **KOMPONENT-STYRNING:**
  * `AacDisplay.tsx`: `h-screen max-h-screen overflow-hidden w-full bg-stone-100 flex flex-col lg:flex-row gap-5 p-4 select-none`
  * `UserControlZone.tsx` & `SpeakerZoneView.tsx`: `h-full min-h-0 flex-col`
  * `AacTileItem.tsx`: Symbolikoner skalas upp från `w-12 h-12` till flexibel fyllnad (`w-20 h-20` / `w-24 h-24`).
* **OS- & WEBBLÄSARSPÄRR:** `overscroll-behavior: none;` och `touch-action: manipulation;` på rotnivå för att blockera OS-gester (som pull-to-refresh eller historik-svep).
* **TEXTMARKERING:** Alla komponenter MÅSTE ha `select-none` / `user-select: none` för att förhindra att systemets förstoringsglas eller kopiera/klistra-menyer triggas vid långtryck.

### [RULE-004: PASSIVE_VISUAL_PRIMING]
* **SYFTE:** Ge impressivt språkstöd (SCA) och semantisk priming utan att stjäla användarens egna initiativ.
* **CONDITION:** När användaren är passiv (inga touch-events på skärmen) och en samtalspartner talar.
* **ACTION:**
  1. Mobilskärmen visar mjukt partnerns destillerade bildrader för att underlätta förståelsen.
  2. När partnern tystnar återgår skärmen *automatiskt* till användarens personliga svarsvy (med förvärmda ordkoncept) utan krav på manuella "Tillbaka"-knappar.
* **CONSTRAINT:** Om användaren gör en touch/svepning bryts detta läge omedelbart och `[RULE-001 STICKY_FLOOR]` träder i kraft.

### [RULE-005: DUAL_VOICE]
* **SYFTE:** Separation mellan privat tankespegel (inre röst) och offentligt budskap.
* **ACTION:**
  * *Privat provläsning:* Klick på enskild bildbricka i budskapsraden exekverar lokal, snabb Web Speech API talsyntes (TTS) tyst i enhetens högtalare/hörsnäcka.
  * *Offentlig röst:* Klick på `GreenCheckButton` skickar hela meningen till Gemini Live för offentlig uppläsning högt i rummet (24 kHz PCM).

### [RULE-006: ELASTIC_MESSAGE_BAR]
* **STRUKTUR:** Budskapsraden har fast höjd i underkanten, `overflow-hidden`, rullningsfri yta och rymmer maximalt 5 symboler samt en fast `GreenCheckButton`.
* **ELASTIK:** CSS Flexbox skalar mjukt ner ikonstorlekarna (`w-24` ned till `w-16`) när antalet symboler ökar från 1 till 5. Alla symboler är alltid 100 % synliga samtidigt.
* **KORRIGERING:** Ett klick på en enskild symbol i budskapsraden triggar tyst lokal TTS och visar en röd radera-bricka (`[x]`) ovanför symbolen för punktkorrigering.

### [RULE-007: EMERGENCY_AND_CONVERSATION_OVERRIDE]
* **ACTION:** Permanent låst snabbknapp/overlay som alltid ligger överst i gränssnittet och överstyr AI-genererade förslag:
  * *Somatiskt Akut:* `[ Ont/Smärta ]`, `[ Toalett ]`, `[ Vatten ]`, `[ Hjälp/Stopp ]`.
  * *Samtalsankare:* `[ Vänta, jag vill säga något ]`, `[ Håller med ]`, `[ Ja ]`, `[ Nej ]`. Ett tryck på `[ Vänta ]` bryter en pågående monolog i rummet via Live-rösten på ett artigt sätt.

### [RULE-008: POST_SPEECH_PAUSE]
* **ACTION:** När `GreenCheckButton` aktiverats och budskapet lästs upp, töms budskapsraden mjukt och skärmen går in i en 3000 ms vilsam andningspaus där inga nya impulsiva förslag blinkar till, så att användaren får landa i rummets reaktion.

### [RULE-009: COLOR_DIARIZATION_AND_ROLE_SYMMETRY]
* **ACTION:** Systemet behandlar alla deltagare som jämlika aktörer. Laptopen visar allas yttranden som destillerade bildrader inramade i deltagarens unika färgzon (t.ex. Blå för Anna, Grön för Kalle, Orange för distansdeltagare).

### [RULE-010: MONOLOGUE_ANCHORING]
* **ACTION:** Vid kontinuerlig monolog från en samtalspartner (> 30 s) låser sig AI-agenten vid max 2–3 stabila kärnbegrepp och vägrar uppdatera skärmen ytterligare förrän den talande gör en reell paus. Laptopen visar en mjukt pulserande visuell vänta-indikator.

### [RULE-011: CHECKIN_RITUAL]
* **ACTION:** Registrering av röst- och ansiktsdiarisering sker via binära mikro-val (t.ex. visualiserat "Kaffe eller Te?"). På < 2 sekunder fångas ansiktsprofil och stämbandsprofil. En Snabbstart-knapp i känd hemmiljö hoppar över ritualen med sparade profiler.

### [RULE-012: FATIGUE_ADAPTATION]
* **ACTION:** Systemet mäter responslatens och felklick. Vid tecken på hjärntrötthet skalas antalet aktiva förslags-slots automatically ner från 5 till 2 stora brickor. Tre manuella snabbknappar finns i gränssnittet: 🟢 Pigg (5), 🟡 Lagom (3–4), 🔴 Trött (2).

### [RULE-013: HAPTIC_FEEDBACK]
* **ACTION:** Alla touch-interaktioner bekräftas via `navigator.vibrate(15)` för taktil trygghet utan hörbara blip-ljud.

### [RULE-014: WCAG_AAA_CONTRAST]
* **ACTION:** Alla bildbrickor, SVG-ikoner och UI-element ska uppfylla WCAG AAA-kontrastkrav med tydliga, mörka ytterlinjer och matta, icke-reflekterande bakgrundsfärger.

### [RULE-015: DUAL_RED_CROSS_LOGIC]
* **ACTION:**
  * *Typ A (I Budskapsraden):* Ett rött kryss över vald ikon. Rensar enbart den valda symbolen från den påbörjade meningen.
  * *Typ B (På AI-förslagsbrickor):* En `[Avfärda]`-knapp på en förslagsbricka. Klick på denna tonar bort ikonen och skickar en negativ viktning till `adaptiveMemoryService` i databasen så AI:n lär sig att undvika begreppet i samma kontext.

### [RULE-016: RESPONSIVE_PROJECTION]
* **ACTION:** Tailwind-klassen `flex-col lg:flex-row` i `AacDisplay.tsx` MÅSTE bevaras. Den garanterar att gränssnittet är staplat vertikalt på mobila enheter, men expanderar sida-vid-sida när det visas på rummets delade laptop-skärm.

### [RULE-017: VISUAL_POINTING]
* **ACTION:** När användaren pekar på ett objekt i live-kamerabilden samplar appen bildkoordinaterna och skickar dem till Gemini Vision. Modellen identifierar objektet (t.ex. "Kaffekanna") och skapar omedelbart en ny bildbricka `[ Kaffekanna ]` på förslagsytan.

---

## 2. SYSTEMARKITEKTUR & FELHANTERING (ADR)

### [ADR-018: FAIL_FAST_VS_GRACEFUL_DEGRADATION]
* **ANVÄNDARYTA (Afasi-vänlig):** Graceful Degradation. Vid nätverksavbrott, WebSocket-krasch eller saknade API-nycklar fryser skärmen vilsamt i nuvarande fungerande läge. Inga feldialoger, röda kraschrutor eller sprakande ljud får visas för användaren.
* **DIAGNOSTIKYTA (Utvecklare/Anhörig):** Fail-Fast. Om API-nyckel saknas visas omedelbart texten `"SAKNAR API-NYCKEL (VITE_GEMINI_API_KEY)"` i klartext i den dolda diagnostikraden.

### [ADR-021: DISTRIBUTED_PERSONAL_AGENTS]
* **MODELL:** Varje deltagare kör en dedikerad, inåtfokuserad agentinstans. Kalles agent lyssnar på rummets samlade ljud med det primära syftet att förutse vad *Kalle* vill svara.

### [ADR-022: LOCAL_FIRST_DATABASE_SYNC]
* **PRINCIP:** Local-First, Sync-Second (Optimistiskt UI).
* **FLÖDE:** Alla touch-events renderas lokalt på < 10 ms. Tillståndssynkronisering (`RoomState`, `ActiveTopicZones`, `AdaptiveMemory`, `MessageQueue`) sker i bakgrunden via WebSockets till en delad realtidsdatabas (Supabase/Firebase/PocketBase).

### [ADR-023: FOUR_TIER_IMAGE_ENGINE]
1. **Tier 1 (Lokal Cache):** < 10 ms (100 vanligaste AAC-kärnbegreppen laddade i minnet).
2. **Tier 2 (Öppna AAC-API:er):** 100–200 ms (ARASAAC / Material Symbols vid saknad lokal nyckel).
3. **Tier 3 (Live Extended Thinking SVG):** < 300 ms. Gemini kodar en skräddarsydd, högkontrast-SVG i realtid via sitt utökade tänkande direkt i verktygsanropet.
4. **Tier 4 (Visual Grounding Camera Cutout):** < 100 ms. Objektklipp direkt från kameran vid peksignal (`[RULE-017]`).

---

## 3. TEKNISKA PROTOKOLL OCH KODKRAV

### [SYSTEM-001: CONSENT_AND_API_CONFIG]
* Klick på mikrofonknappen sätter `consent.granted = true` och anropar `activateSession()` omedelbart utan verbal hälsning.
* `inputAudioTranscription` och `outputAudioTranscription` aktiveras i `LiveConnectConfig`.
* Alla textimpulser från skärmklick skickas tyst via `sendRealtimeInput({ text: ... })` enligt specifikationen i `SKILL.md`.
* Uppdatera dokumentationsregler i `live_listener/doc/BUSINESS_RULES.md` och `aac_display/doc/BUSINESS_RULES.md`.

### [SYSTEM-002: AUDIO_PCM_FORMAT]
* Mikrofonslingan samplas och nedsamplas till **16 kHz PCM Raw Audio** för insändning till Gemini Live WebSocket.
* Utgående röst från Gemini tages emot som **24 kHz PCM** och spelas upp via Web Audio API. Högtalarljud dämpas lokalt mellan enheter i samma rum (Acoustic Spatial Muting) för att eliminera rundgång.

### [SYSTEM-003: DYNAMIC_CAMERA_SWITCH]
* Agenten har tillgång till verktygsanropet `switch_camera({ target: "FRONT" | "REAR" })` för att be appen skifta videoström mellan ansikte och objekt i rummet.

### [SYSTEM-004: DIAGNOSTIC_ZIP_AND_TIME_AWARENESS]
* Filen `live_listener/domain/diagnosticRecorder.ts` underhåller en rullande 60-sekunders RAM-buffert bestående av:
  1. `events.json`: MÅSTE innehålla tidsstämplade transkriptioner, tidsmedvetenhet och `update_topic_zones` funktionsanrop.
  2. Skärmvisning (`getDisplayMedia`).
  3. Kameravisning (`getUserMedia`).
  4. Kombinerat ljudspår (Mikrofon in + Gemini Live PCM ut).
* Knappen `[Ladda ned Felsöknings-ZIP]` i den dolda diagnostikpanelen (`UserControlZone.tsx`) buntar filerna till `diagnostics_60s.zip`. Panelens aktivering sker via dold 3-fingers långtryckning i skärmens överkant.

### [SYSTEM-005: CODE_CLEANUP]
* Dölj/radera de statiska övningsknapparna (Fika, Handla, Hälsa) så att alla kategorier och samtalszoner byggs 100 % dynamiskt av AI-agenten.

### [SYSTEM-006: DUAL_MEDIA_STREAMING]
* Systemet underhåller två parallella videokanaler till Gemini Vision:
  1. `screenStream`: Samplar `AacDisplay` DOM-ytan i 1 fps så AI:n ser exakt vad användaren gör på skärmen.
  2. `roomStream`: Samplar den fysiska kameran för rumskontext och Visual Grounding.

### [SYSTEM-007: SESSION_HYDRATION]
* Både budskapsradens tillstånd och sessionstillståndet persisteras kontinuerligt i `sessionStorage`. Vid oavsiktlig omladdning (F5 eller swipe) återställs UI-tillståndet på < 5 ms utan förlust av påbörjad mening.

### [SYSTEM-008: OFFLINE_FALLBACK]
* Vid totalt WebSocket/Nätverks-avbrott faller appen mjukt tillbaka till att fungera som en lokal AAC-tavla som enbart använder lokal talsyntes (Web Speech API) och lokalt cachade ikoner.

### [SYSTEM-009: AI_DESTILLATION_MODE]
* Systeminstruktionen till Gemini Live MÅSTE kräva: *"Du transkriberar INTE. Du destillerar. Koka ner långa talade monologer till maximalt 2-3 visuella kärnkoncept i dina anrop till `update_topic_zones`."*

### [SYSTEM-010: ZERO_NAVIGATION_OVERHEAD]
* Inga nästlade menyer eller "Tillbaka"-knappar får existera i den aktiva samtalsvyn. Återgångar sker helt automatiskt när ämnet byts eller via den fasta Hem/Rensa-knappen.

---

## 4. UTVECKLARPROTOKOLL (DEV)

### [DEV-001: VERIFICATION_PROTOCOL]
* **ACTION FÖR AI STUDIO:** Innan produktionskod i `/src` ändras MÅSTE följande linjära planeringscykel genomföras:
  1. Kör `npm run verify` eller motsvarande typkontroll.
  2. Uppdatera nödvändiga token-filer (`REQUIRED_TOKEN.txt`).
  3. Du MÅSTE stanna och invänta mänskligt godkännande vid avslutad specifikation (steg 3c i planeringscykeln) innan du genererar eller ändrar `.tsx`-filer.
* **STRIKT FÖRBUD:** Skapa, konfigurera eller implementera INGA E2E-tester (Puppeteer/Cypress) under denna fas för att bevara fokus på kärnfunktionalitet.