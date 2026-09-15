import { useState, useRef, useCallback, useEffect, Suspense, lazy } from 'react';
import { PageWrapper } from '@/components/PageWrapper';
import { DataBadge, SourceInfo } from '@/components/DataBadges';
import { useApp } from '@/context/AppContext';
import { processAIQueryWithRADE, type AIAssistantContext } from '@/services/aiAssistantService';
import { voiceService } from '@/services/voiceService';
import { detectLanguage } from '@/services/languageDetector';
import { formatIntentLabel, formatEntities, getResponseTemplate } from '@/services/multilingualResponses';
import { freshnessBadge } from '@/services/freshnessValidator';
import type { AIResponse } from '@/types';
import { Send, Volume2, Square, Keyboard, ExternalLink, Sparkles, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VoiceOrb, type VoiceState } from '@/components/voice/VoiceOrb';

// 3D AI core is lazily loaded — visualization only, zero impact on the
// STT → LLM → TTS pipeline below.
const VoiceCore3D = lazy(() => import('@/components/voice/VoiceCore3D'));


interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  response?: AIResponse;
  detectedLanguage?: string;
  intent?: string;
  entityChips?: string[];
  freshnessLevel?: string;
}

const SUGGESTED_QUESTIONS = [
  'What is today\u2019s price?',
  'Will it rain today?',
  'What government schemes are available?',
  'Where can I sell my crop?',
  'What crop should I grow?',
  'How do I check my crop health?',
];

const LANG_MAP: Record<string, string> = {
  en: 'en-IN', te: 'te-IN', hi: 'hi-IN', ta: 'ta-IN', kn: 'kn-IN', ml: 'ml-IN', mr: 'mr-IN',
};

const LANG_LABELS: Record<string, string> = {
  en: 'English', te: 'తెలుగు', hi: 'हिन्दी', ta: 'தமிழ்', kn: 'ಕನ್ನಡ', ml: 'മലയാളം', mr: 'मराठी',
};

export function TalkPage() {
  const { t, language, location, demoMode } = useApp();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: getResponseTemplate(language).greeting,
    },
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastQueryRef = useRef<string>('');

  // Visualization state derived from the existing pipeline flags only
  const voiceState: VoiceState = isListening
    ? 'listening'
    : isProcessing
      ? 'thinking'
      : speakingIndex !== null
        ? 'speaking'
        : 'idle';


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  useEffect(() => {
    if (showTextInput) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showTextInput]);

  // Update greeting when language changes
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].role === 'assistant' && !prev[0].response) {
        return [{ role: 'assistant', text: getResponseTemplate(language).greeting }];
      }
      return prev;
    });
  }, [language]);

  const handleListen = useCallback(() => {
    setVoiceError(null);
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
      return;
    }
    const started = voiceService.startListening(
      LANG_MAP[language] || 'en-IN',
      (text) => {
        setInput(text);
        setRecognizedText(text);
        setIsListening(false);
      },
      (error) => {
        setVoiceError(error);
        setIsListening(false);
        setShowTextInput(true);
      },
      () => {
        setIsListening(false);
      },
    );
    if (started) {
      setIsListening(true);
      setShowTextInput(false);
      setRecognizedText(null);
    } else {
      setShowTextInput(true);
    }
  }, [isListening, language]);

  const handleSubmit = useCallback(async (textArg?: string) => {
    const query = (textArg ?? input).trim();
    if (!query || isProcessing) return;

    lastQueryRef.current = query;
    const detectedLang = detectLanguage(query);
    const userMsg: ChatMessage = { role: 'user', text: query, detectedLanguage: detectedLang };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setRecognizedText(null);
    setIsProcessing(true);

    const ctx: AIAssistantContext = { location, language, demoMode };

    try {
      const radeResult = await processAIQueryWithRADE(query, ctx);
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        text: radeResult.response.text,
        response: radeResult.response,
        detectedLanguage: radeResult.detectedLanguage,
        intent: radeResult.intent,
        entityChips: formatEntities(radeResult.detectedLanguage, radeResult.entities),
        freshnessLevel: radeResult.freshness?.level,
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Auto-speak the response in the detected language
      if (autoSpeak) {
        const hasVoice = voiceService.hasVoiceForLanguage(radeResult.detectedLanguage);
        const ok = voiceService.speak(radeResult.response.text, radeResult.detectedLanguage, () => {
          setSpeakingIndex(null);
        });
        if (ok) {
          setSpeakingIndex(messages.length);
        }
        if (!hasVoice && !ok) {
          setVoiceError(null);
        }
      }
    } catch {
      const tpl = getResponseTemplate(language);
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        text: tpl.status.unavailable,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setIsProcessing(false);
    }
  }, [input, isProcessing, location, language, demoMode, autoSpeak, messages.length]);

  const handleSpeak = (text: string, index: number, msgLang?: string) => {
    if (speakingIndex === index) {
      voiceService.stopSpeaking();
      setSpeakingIndex(null);
      return;
    }
    voiceService.stopSpeaking();
    setSpeakingIndex(null);

    const speakLang = msgLang || language;
    const ok = voiceService.speak(text, speakLang, () => {
      setSpeakingIndex(null);
    });
    if (ok) {
      setSpeakingIndex(index);
    } else {
      setVoiceError('Voice playback for this language is not available on this device.');
    }
  };

  return (
    <PageWrapper title={`\u{1F3A4} ${t('talkToAI')}`}>
      {/* Processing indicator with RADE steps */}
      {isProcessing && (
        <div className="card mb-3 bg-green-50 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-green-700 animate-pulse" />
            <span className="text-sm font-medium text-green-800">RADE Engine processing...</span>
          </div>
          <div className="flex gap-1.5">
            <span className="w-2 h-2 bg-green-600 rounded-full animate-bounce" />
            <span className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <span className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="space-y-3 mb-4 max-h-[50vh] overflow-y-auto rounded-2xl border border-emerald-950/25 bg-emerald-950/80 p-3 shadow-hero backdrop-blur-sm">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] rounded-2xl p-3 ${msg.role === 'user' ? 'bg-green-700 text-white shadow-card' : 'bg-white/95 text-stone-900 border border-white/50 shadow-card'}`}>
              {/* Detected language indicator for user messages */}
              {msg.role === 'user' && msg.detectedLanguage && (
                <div className="text-xs mb-1 opacity-80">
                  {LANG_LABELS[msg.detectedLanguage] || msg.detectedLanguage}
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>

              {/* RADE info for assistant messages */}
              {msg.response && (
                <div className="mt-2 space-y-2">
                  {/* Intent + freshness badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {msg.intent && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">
                        <Sparkles className="w-3 h-3" />
                        {formatIntentLabel(msg.detectedLanguage || language, msg.intent as never)}
                      </span>
                    )}
                    <DataBadge status={msg.response.dataStatus} />
                    {msg.response.confidence && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                        Confidence: {msg.response.confidence}
                      </span>
                    )}
                    {msg.freshnessLevel && msg.freshnessLevel !== 'UNAVAILABLE' && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${freshnessBadge(msg.freshnessLevel as never).color}`}>
                        {freshnessBadge(msg.freshnessLevel as never).text}
                      </span>
                    )}
                  </div>

                  {/* Entity chips */}
                  {msg.entityChips && msg.entityChips.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {msg.entityChips.map((chip, ci) => (
                        <span key={ci} className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded bg-stone-100 text-stone-700">
                          <Tag className="w-2.5 h-2.5" />{chip}
                        </span>
                      ))}
                    </div>
                  )}

                  {msg.response.sources.length > 0 && (
                    <div>
                      {msg.response.sources.map((s, si) => (
                        <SourceInfo key={si} source={s} />
                      ))}
                    </div>
                  )}
                  {msg.response.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {msg.response.actions.map((a, ai) => (
                        a.link?.startsWith('/') ? (
                          <button key={ai} onClick={() => navigate(a.link!)} className="btn btn-secondary text-sm px-3 py-2">
                            {a.label}
                          </button>
                        ) : a.link ? (
                          <a key={ai} href={a.link} target="_blank" rel="noopener noreferrer" className="btn btn-secondary text-sm px-3 py-2">
                            <ExternalLink className="w-4 h-4" /> {a.label}
                          </a>
                        ) : a.action === 'retry' ? (
                          <button key={ai} onClick={() => { setMessages(prev => prev.slice(0, -1)); handleSubmit(lastQueryRef.current); }} className="btn btn-primary text-sm px-3 py-2">
                            {a.label}
                          </button>
                        ) : null
                      ))}
                    </div>
                  )}
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => handleSpeak(msg.text, i, msg.detectedLanguage)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-800 mt-1"
                      aria-label={t('listen')}
                    >
                      {speakingIndex === i ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      {speakingIndex === i ? t('stop') : t('listen')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Recognized text confirmation */}
      {recognizedText && !isProcessing && (
        <div className="card mb-3 bg-green-50 border-green-200 animate-fade-in">
          <p className="text-sm font-medium text-stone-600 mb-1">
            {LANG_LABELS[detectLanguage(recognizedText)] || 'You'}:
          </p>
          <p className="text-sm text-stone-800 mb-3">"{recognizedText}"</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => handleSubmit(recognizedText)} className="btn btn-primary text-sm px-3 py-2 touch-target">
              {language === 'te' ? 'పంపండి' : language === 'hi' ? 'भेजें' : 'Send'}
            </button>
            <button onClick={() => { setInput(recognizedText); setShowTextInput(true); setRecognizedText(null); }} className="btn btn-outline text-sm px-3 py-2 touch-target">
              {language === 'te' ? 'సవరించండి' : language === 'hi' ? 'संपादित करें' : 'Edit'}
            </button>
            <button onClick={handleListen} className="btn btn-outline text-sm px-3 py-2 touch-target">
              {language === 'te' ? 'మళ్లీ మాట్లాడండి' : language === 'hi' ? 'फिर से बोलें' : 'Speak Again'}
            </button>
          </div>
        </div>
      )}

      {/* Suggested Questions */}
      {messages.length <= 1 && !recognizedText && (
        <div className="mb-4 rounded-2xl border border-white/25 bg-emerald-950/70 p-3 shadow-card backdrop-blur-sm">
          <p className="text-sm font-medium text-white mb-2">
            {language === 'te' ? 'ప్రయత్నించండి:' : language === 'hi' ? 'पूछें:' : 'Try asking:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button key={i} onClick={() => { setInput(q); handleSubmit(q); }} className="btn btn-secondary text-sm px-3 py-2 shadow-card">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Voice Error */}
      {voiceError && (
        <div className="card mb-3 bg-amber-50 border-amber-200 text-sm text-amber-800">
          {voiceError}
          <button onClick={() => { setVoiceError(null); setShowTextInput(true); }} className="ml-2 underline font-medium">
            {t('typeInstead')}
          </button>
        </div>
      )}

      {/* Text Input */}
      {showTextInput && (
        <div className="flex gap-2 mb-4">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={language === 'te' ? 'మీ ప్రశ్నను టైప్ చేయండి...' : language === 'hi' ? 'अपना प्रश्न टाइप करें...' : 'Type your question...'}
            className="flex-1 rounded-xl border border-emerald-950/30 bg-white/95 px-4 py-3 text-base text-stone-900 placeholder:text-stone-500 shadow-card focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-500/40"
            aria-label="Type your question"
          />
          <button onClick={() => handleSubmit()} disabled={!input.trim() || isProcessing} className="btn btn-primary touch-target px-4" aria-label={t('send')}>
            <Send className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Auto-speak toggle */}
      <div className="flex items-center justify-center mb-3">
        <label className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-emerald-950/70 px-3 py-2 text-sm font-medium text-white cursor-pointer shadow-card backdrop-blur-sm">
          <input type="checkbox" checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)} className="w-4 h-4 rounded accent-green-700" />
          {language === 'te' ? 'స్వయంచాలక వాయిస్' : language === 'hi' ? 'स्वतः आवाज़' : 'Auto voice response'}
        </label>
      </div>

      {/* Microphone Button — premium AI interaction: layered photographic
          halo + orb + lightweight 3D core. Visualization only; the
          STT → LLM → TTS pipeline below is untouched. */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-full max-w-sm h-48 pointer-events-none select-none overflow-hidden rounded-3xl" aria-hidden="true">
          <img
            src={`${import.meta.env.BASE_URL}assets/cinematic/field.jpg`}
            alt=""
            draggable={false}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/55 via-emerald-950/25 to-[#f8faf8]" />
          <div className="absolute inset-0">
            <Suspense fallback={null}>
              <VoiceCore3D state={voiceState} height={192} />
            </Suspense>
          </div>
        </div>
        <div className="relative z-10 -mt-14">
          <VoiceOrb
            state={voiceState}
            size={116}
            onClick={handleListen}
            disabled={isProcessing}
            title={t('tapToSpeak')}
          />
        </div>
        <button onClick={() => setShowTextInput(s => !s)} className="btn btn-secondary text-sm px-4 py-2 shadow-card">
          <Keyboard className="w-4 h-4" /> {t('typeInstead')}
        </button>
      </div>
    </PageWrapper>
  );
}
