export interface VoiceServiceState {
  isSupported: boolean;
  isListening: boolean;
  error: string | null;
}

export class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;

  get isSupported(): boolean {
    return typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  startListening(
    lang: string,
    onResult: (text: string) => void,
    onError: (error: string) => void,
    onEnd: () => void,
  ): boolean {
    if (!this.isSupported) {
      onError('Speech recognition is not supported in this browser. Please use text input instead.');
      return false;
    }

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      onError('Speech recognition is not available.');
      return false;
    }

    this.stopListening();

    const recognition = new SpeechRecognitionClass();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript || '';
      onResult(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.isListening = false;
      const errorMessages: Record<string, string> = {
        'no-speech': 'No speech was detected. Please try again.',
        'audio-capture': 'Microphone is not available. Please check your microphone.',
        'not-allowed': 'Microphone permission was denied. Please allow microphone access.',
        'service-not-allowed': 'Speech recognition service is not allowed.',
        'network': 'Network error occurred during speech recognition.',
      };
      onError(errorMessages[event.error] || `Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    try {
      recognition.start();
      this.isListening = true;
      this.recognition = recognition;
      return true;
    } catch {
      onError('Could not start speech recognition. Please try again.');
      return false;
    }
  }

  stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.recognition = null;
    }
    this.isListening = false;
  }

  get listening(): boolean {
    return this.isListening;
  }

  speak(text: string, lang: string, onEnd?: () => void): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return false;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    const langMap: Record<string, string> = {
      'en': 'en-IN',
      'te': 'te-IN',
      'hi': 'hi-IN',
      'ta': 'ta-IN',
      'kn': 'kn-IN',
      'ml': 'ml-IN',
      'mr': 'mr-IN',
    };
    utterance.lang = langMap[lang] || 'en-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // Try to find a matching voice for the language
    const voices = window.speechSynthesis.getVoices();
    const matchVoice = voices.find(v => v.lang === utterance.lang)
      || voices.find(v => v.lang.startsWith(lang))
      || voices.find(v => v.lang.includes(lang));
    if (matchVoice) {
      utterance.voice = matchVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  }

  stopSpeaking() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  get isSpeaking(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking;
  }

  // Check if a voice is available for the given language
  hasVoiceForLanguage(lang: string): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    const voices = window.speechSynthesis.getVoices();
    const langMap: Record<string, string> = {
      'en': 'en-IN', 'te': 'te-IN', 'hi': 'hi-IN',
      'ta': 'ta-IN', 'kn': 'kn-IN', 'ml': 'ml-IN', 'mr': 'mr-IN',
    };
    const target = langMap[lang] || 'en-IN';
    return voices.some(v => v.lang === target || v.lang.startsWith(lang));
  }
}

export const voiceService = new VoiceService();
