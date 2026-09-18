# Steg 3a: Helhet, orkestrering och integration (TCK-006)

## 1. Helhetsarkitektur
- `AacDisplay` agerar layoutorkestrator och läser in `speakerZones: SpeakerZone[]`.
- Beroende på `speakerZones.length`:
  - 1 talare: Fullbreddsvy med centrerad rymd.
  - 2 talare: 2 kolumner.
  - 3 talare: 3-kolumnsvy på bred skärm eller 2+1 layout.
  - 4+ talare: 2x2 rutnätslayout (`grid grid-cols-1 md:grid-cols-2 gap-4`).
- `SpeakerZoneView` renderar färgkodade ramar baserade på utökat `ColorTheme` (`amber`, `emerald`, `sky`, `slate`, `violet`, `rose`).
