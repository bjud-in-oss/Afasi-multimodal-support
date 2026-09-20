# Steg 3b: Domänkontrakt och fraktal dokumentation (Cykel 7 - TCK-008)

## 1. Domänkontrakt
`LiveListenerService`:
- `handleWebSocketError(code: string | number, message: string): void`: Sätter diagnostikstatus till `WS ERROR: ${code} - ${message}`.
- `handleWebSocketClose(code: string | number, reason: string): void`: Sätter diagnostikstatus till `WS CLOSED: ${code} - ${reason}`.
- `updateDiagnosticStatus(status: string): void`: Uppdaterar `lastEventStatus` och notifierar lyssnare.
- `speechSynthesizer`: No-op i produktion.
- `startListening(fromUserMicClick?: boolean): Promise<void>`
- `confirmConsent(fromUserMicClick?: boolean): Promise<void>`
