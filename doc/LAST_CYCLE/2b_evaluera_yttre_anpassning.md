# Steg 2b: Evaluera Yttre Anpassning (Cykel 10 - TCK-013)

## 1. Utvärdering mot AAC Kognitiva Regler (`doc/AAC_COGNITIVE_RULES.md`)

| Regel | Kognitivt Syfte | Uppfyllnad i TCK-013 |
| :--- | :--- | :--- |
| **RULE-006 (Elastisk budskapsrad)** | Minska kognitiv belastning; förhindra att symboler hamnar utanför synfältet. | Tak på max 5 symboler. Flex-skalning från `w-24` ner till `w-16` säkerställer 100 % synlighet utan rullningslister. |
| **RULE-015 (Typ A Kryss för punktkorrigering)** | Undvika frustration av att behöva bygga om en hel mening vid ett feltryck. | Klick på specifik symbol i budskapsraden provläser och ger ett distinkt Typ A rött kryss för att avlägsna enbart den symbolen. |
| **RULE-005 (Akustisk Feedback & Röstseparation)** | Säkerställa att deltagaren har kontroll över vad som sägs offentligt vs privat. | Enskilt klick i budskapsraden ger dämpad/privat provlyssning. Endast Grön Bock avfyrar full offentlig röstuppläsning. |
| **RULE-008 (Post-speech Reset & Andningspaus)** | Ge motorisk och mental återhämtning efter genomförd kommunikationshandling. | 3000 ms lugn andningspaus utan plötsliga visuella hopp, följt av mjuk nollställning av budskapsraden. |
| **RULE-003 (No Scroll UI)** | Eliminera finmotoriska feldrag och "ur syn, ur sinn". | Hela kontrollzonen och budskapsraden ryms i den kompakta bottenraden (`max-h-24 sm:max-h-28`) på mobil och breddas på desktop. |

## 2. Slutsats
Den yttre anpassningen överensstämmer fullständigt med de kognitiva afasiprinciperna och skapar en sammanhållen, stressfri kommunikationscykel.
