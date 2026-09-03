import { Language } from '../types';

class AudioService {
  private isSpeaking = false;
  private recognition: any = null;

  // Multi-lingual Text to Speech
  public speak(text: string, lang: Language, onEnd?: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      const langMap: Record<Language, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        mr: 'mr-IN',
      };

      utterance.lang = langMap[lang] || 'en-IN';
      utterance.rate = 0.95; // Slightly slower for hospital kiosk clarity
      utterance.pitch = 1.0;

      // Try to find native voices
      const voices = window.speechSynthesis.getVoices();
      const targetVoice = voices.find((v) => v.lang.startsWith(langMap[lang]) || v.lang.includes(lang));
      if (targetVoice) {
        utterance.voice = targetVoice;
      }

      this.isSpeaking = true;

      utterance.onend = () => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    }
  }

  public stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
    }
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public isSpeechRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  // Voice Recognition (ASR) with Bhashini/AI4Bharat architectural hooks
  public startSpeechRecognition(
    lang: Language,
    onTranscript: (text: string, isFinal: boolean) => void,
    onError: (err: any) => void
  ): () => void {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      try {
        const recognition = new SpeechRecognition();
        this.recognition = recognition;
        recognition.continuous = false;
        recognition.interimResults = true;

        const langMap: Record<Language, string> = {
          en: 'en-IN',
          hi: 'hi-IN',
          mr: 'mr-IN',
        };
        recognition.lang = langMap[lang] || 'en-IN';

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript) {
            onTranscript(finalTranscript, true);
          } else if (interimTranscript) {
            onTranscript(interimTranscript, false);
          }
        };

        recognition.onerror = (e: any) => {
          onError(e);
        };

        recognition.start();

        return () => {
          try {
            recognition.stop();
          } catch {
            // ignore
          }
        };
      } catch (err) {
        onError(err);
      }
    } else {
      onError(new Error('Speech recognition not natively supported on this browser'));
    }

    return () => {};
  }
}

export const audioService = new AudioService();
