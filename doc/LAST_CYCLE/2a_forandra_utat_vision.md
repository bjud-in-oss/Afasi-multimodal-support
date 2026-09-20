# Steg 2a: Förändra utåt - Vision & Arkitektonisk anpassning (Cykel 8 - TCK-008B)

## 1. Yttre vision & Arkitektonisk anpassning
Den yttre upplevelsen anpassas till en professionell, modern AAC-upplevelse driven av **Gemini 3.8 Live API** och **ADR-018** (Fail Fast & No Mock Infrastructure):

1. **Omedelbar respons vid användarklick**:
   - Användaren klickar på mikrofonikonen för att starta samtalslyssningen. Handlingen fungerar som ett aktivt samtycke.
   - Mikrofonströmmen (16kHz PCM16-mono) startas och WebSocket-anslutningen etableras utan fördröjande röstmeddelanden eller syntetiska avbrott.
   - Affärsregel 1 i `src/features/live_listener/doc/BUSINESS_RULES.md` definierar formellt manuellt klick som giltigt aktivt samtycke.

2. **Gemini 3.8 Live-protokoll & Icke-blockerande verktygsanrop (`SKILL.md`)**:
   - Verktyget `update_topic_zones` deklareras med `behavior: "NON_BLOCKING"`, vilket tillåter Gemini att köra bakgrundsfunktionsanrop samtidigt som den talar eller tar emot ljud.
   - `inputAudioTranscription` och `outputAudioTranscription` aktiveras så att taltranskriptioner strömmas i realtid.
   - Textinteraktioner skickas med `sendRealtimeInput({ text: ... })` i stället för `sendClientContent`, vilket bevarar modellens kontinuerliga tal utan ovälkomna avbrott.
   - All symbolpresentation sker reaktivt från Geminis skarpa dataström. En avdupliceringsspärr säkerställer att inte samma symbol ritas upp dubbelt om Gemini skickar både transkriberad text och funktionsanrop.

3. **Tydlig diagnostik vid saknad API-nyckel**:
   - Saknas API-nyckel i miljövariablerna visas `"SAKNAR API-NYCKEL (VITE_GEMINI_API_KEY)"` omedelbart i diagnostikraden. Inga dolda fallbacks maskerar bristande konfiguration.
