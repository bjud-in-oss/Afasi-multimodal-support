# Affärsregler: adaptive_memory

1. **Deterministisk anpassning**: Alla viktjusteringar beräknas deterministiskt utan hallucinationer.
2. **Positiv förstärkning**: Bekräftelser (grön bock) höjer konfidensen och lyfter brickor över frågeteckentröskeln ($\ge 0.80$).
3. **Negativ eliminering**: Avfärdanden (rött kryss) sänker konfidensen under synlighetströskeln ($< 0.50$) så att felaktiga förslag dämpas permanent i samma kontext.
4. **Lokal integritet**: Inlärd data sparas lokalt på användarens enhet i `localStorage` med minnesbaserad fallback.
