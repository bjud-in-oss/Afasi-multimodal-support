# Domän: aac_display

Denna domän ansvarar för det kompromisslöst textlösa användargränssnittet för afasideltagaren ("Maggan").

## Moduler
- `components/AacDisplay.tsx`: Huvudyta med flexibel partitionering.
- `components/SpeakerZoneView.tsx`: Enskild samtalszon med dynamiska bildbrickor.
- `components/UserControlZone.tsx`: Deltagarens scen-brickor och feedbackreglage.
- `components/AacTileItem.tsx`: Bildbricka med konfidenshantering och frågetecken-överlägg.
- `domain/types.ts`: Datakontrakt.
- `hooks/useAacDisplay.ts`: Reaktiv tillståndshantering.
