import { useState, useEffect, useRef, useCallback } from "react";
import { LiveListenerService } from "../domain/liveListenerService";
import { ListenerStatus, SpeakerId, LiveUtteranceEvent } from "../domain/types";

export function useLiveListener(onUtterance?: (event: LiveUtteranceEvent) => void) {
  const [status, setStatus] = useState<ListenerStatus>("idle");
  const [activeSpeaker, setActiveSpeaker] = useState<SpeakerId | null>(null);

  const onUtteranceRef = useRef(onUtterance);
  onUtteranceRef.current = onUtterance;

  const serviceRef = useRef<LiveListenerService | null>(null);

  if (!serviceRef.current) {
    serviceRef.current = new LiveListenerService({
      onUtterance: (evt) => {
        if (onUtteranceRef.current) {
          onUtteranceRef.current(evt);
        }
      },
      onStatusChange: (s) => setStatus(s),
      onActiveSpeakerChange: (spk) => setActiveSpeaker(spk),
    });
  }

  const service = serviceRef.current;

  const startListening = useCallback(() => {
    service.startListening();
  }, [service]);

  const confirmConsent = useCallback(() => {
    service.confirmConsent();
  }, [service]);

  const pauseListening = useCallback(() => {
    service.pauseListening();
  }, [service]);

  const resumeListening = useCallback(() => {
    service.resumeListening();
  }, [service]);

  const stopListening = useCallback(() => {
    service.stopListening();
  }, [service]);

  const simulateVoice = useCallback(
    (speakerId: SpeakerId, text: string) => {
      service.simulateUtterance(speakerId, text);
    },
    [service]
  );

  useEffect(() => {
    return () => {
      service.stopListening();
    };
  }, [service]);

  return {
    status,
    activeSpeaker,
    isConsentNeeded: status === "awaiting_consent",
    isListening: status === "listening",
    startListening,
    confirmConsent,
    pauseListening,
    resumeListening,
    stopListening,
    simulateVoice,
  };
}
