# Domän: adaptive_memory

Denna domän ansvarar för den successiva inlärningsmotorn som gör att Maggan personanpassas för afasideltagaren utan att införa menyer eller text.

## Moduler
- `domain/adaptiveMemoryService.ts`: Core service med lokal persistering och viktningsalgoritm.
- `domain/types.ts`: Typer för associationer, minne och feedback.
- `hooks/useAdaptiveMemory.ts`: React-hook för UI-integration.
- `index.ts`: Publikt gränssnitt.
