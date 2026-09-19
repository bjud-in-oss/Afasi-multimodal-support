import { useState, useEffect, useRef, useCallback } from "react";
import { LiveListenerService } from "../domain/liveListenerService";
import { ListenerStatus, SpeakerId, LiveUtteranceEvent, CameraStatus } from "../domain/types";

export function useLiveListener(onUtterance?: (event: LiveUtteranceEvent) => void) {
  const [status, setStatus] = useState<ListenerStatus>("idle");
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("inactive");
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
      onCameraStatusChange: (cs) => setCameraStatus(cs),
      onActiveSpeakerChange: (spk) => setActiveSpeaker(spk),
    });
  }

  const service = serviceRef.current;

  const startListening = useCallback(async (fromUserMicClick: boolean = true) => {
    await service.resumeAudio();
    await service.startListening(fromUserMicClick);
  }, [service]);

  const confirmConsent = useCallback(async (fromUserMicClick: boolean = true) => {
    await service.resumeAudio();
    await service.confirmConsent(fromUserMicClick);
  }, [service]);

  const pauseListening = useCallback(() => {
    service.pauseListening();
  }, [service]);

  const resumeListening = useCallback(async () => {
    await service.resumeAudio();
    await service.resumeListening();
  }, [service]);

  const stopListening = useCallback(() => {
    service.stopListening();
  }, [service]);

  const resumeAudio = useCallback(async () => {
    await service.resumeAudio();
  }, [service]);

  const triggerCameraBurst = useCallback(
    (reason?: string) => {
      service.triggerCameraBurst(reason);
    },
    [service]
  );

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
    cameraStatus,
    activeSpeaker,
    isConsentNeeded: status === "awaiting_consent",
    isListening: status === "listening",
    isCameraActive: cameraStatus === "active",
    startListening,
    confirmConsent,
    pauseListening,
    resumeListening,
    stopListening,
    resumeAudio,
    triggerCameraBurst,
    simulateVoice,
  };
}
