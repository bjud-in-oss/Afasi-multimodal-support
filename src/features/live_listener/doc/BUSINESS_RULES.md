# Affärsregler: live_listener

1. **Muntligt samtyckeskrav**: Ingen röstström analyseras eller buffras innan Gemini har ställt frågan högt till rummet och fått samtycke bekräftat.
2. **Talarseparation (Diarization)**: Varje detekterad fras knyts till en specifik talare (`speaker-1` eller `speaker-2`) och visas i den talarens dedikerade zon på skärmen.
3. **Visuell zonindikering**: När en talare yttrar sig lyser dess zon upp mjukt utan att textetiketter används.
4. **Resiliens**: Vid saknat mikrofonsvar eller i iframes faller systemet tillbaka till mjuk övningssimulering utan att krascha.
