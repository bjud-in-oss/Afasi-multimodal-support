# Domän: live_listener

Denna domän ansvarar för röstaktivering, detektering av talare och muntligt samtyckesflöde för Maggan.

## Moduler
- `domain/liveListenerService.ts`: Core service med talsyntes-fråga, VAD och symbolmappning.
- `domain/types.ts`: Typer för talarhändelser, status och samtyckestillstånd.
- `hooks/useLiveListener.ts`: React-hook för UI-integration.
- `index.ts`: Publikt gränssnitt.
