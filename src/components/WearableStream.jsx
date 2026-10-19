import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Sparkles, Volume2, Clock, Trash2, AudioLines, Radio } from 'lucide-react';

export function WearableStream({
  dialogueHistory,
  onIngestDialogue,
  onClearHistory,
  isProcessing
}) {
  const [inputText, setInputText] = useState('');
  const [speaker, setSpeaker] = useState('Oliver');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript && transcript.trim()) {
          onIngestDialogue(transcript.trim(), speaker);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [speaker, onIngestDialogue]);

  const toggleListening = () => {
    if (!speechSupported) {
      alert('Browser Speech Recognition is unavailable in this window. Use the input bar or utterance stream buttons.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onIngestDialogue(inputText.trim(), speaker);
    setInputText('');
  };

  const triggerUtterance = (text, targetSpeaker = 'Household') => {
    onIngestDialogue(text, targetSpeaker);
  };

  return (
    <div className="flex flex-col h-full bg-[#101620] border border-[#1e293b] rounded-2xl overflow-hidden shadow-2xl">
      {/* Console Header */}
      <div className="px-4 py-3.5 border-b border-[#1e293b] flex items-center justify-between bg-[#141c28]">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FF9900]/15 text-[#FF9900] border border-[#FF9900]/30">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Bee Live Transcript Feed
              <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Real-Time Diarization
              </span>
            </h2>
            <p className="text-[11px] text-gray-400">Continuous wearable voice-to-intent stream</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Acoustic Spectrum Visualizer */}
          <div className="flex items-center gap-0.5 h-6 px-2.5 py-1 bg-[#0b0f17] rounded-lg border border-[#1e293b]">
            {[45, 80, 55, 95, 65, 35, 85, 50, 75, 45].map((val, idx) => (
              <span
                key={idx}
                className="w-1 bg-[#FF9900] rounded-full wave-bar"
                style={{
                  height: isListening ? `${val}%` : `${val * 0.45}%`,
                  animationDuration: `${0.75 + idx * 0.12}s`,
                  opacity: isListening ? 1 : 0.55
                }}
              />
            ))}
          </div>

          <button
            onClick={onClearHistory}
            className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800/60 transition"
            title="Clear Transcript Log"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Utterance Replay Strip */}
      <div className="px-4 py-2.5 bg-[#0c1018] border-b border-[#1e293b] flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-gray-400 font-semibold whitespace-nowrap flex items-center gap-1.5 text-[11px]">
          <AudioLines className="w-3.5 h-3.5 text-[#FF9900]" /> Voice Stream:
        </span>
        <button
          onClick={() => triggerUtterance("We're completely out of whole milk and organic eggs, can you order some?", 'Household')}
          disabled={isProcessing}
          className="px-2.5 py-1 rounded-md bg-[#161f2e] hover:bg-[#1f2b3f] border border-[#2a3852] text-gray-200 font-medium whitespace-nowrap transition text-[11px]"
        >
          🥛 Pantry Restock (Milk &amp; Eggs)
        </button>
        <button
          onClick={() => triggerUtterance("Let's meet tomorrow at 3 PM to review the Q4 roadmap with Sarah", 'Oliver')}
          disabled={isProcessing}
          className="px-2.5 py-1 rounded-md bg-[#161f2e] hover:bg-[#1f2b3f] border border-[#2a3852] text-gray-200 font-medium whitespace-nowrap transition text-[11px]"
        >
          📅 Schedule Meeting (3:00 PM)
        </button>
        <button
          onClick={() => triggerUtterance("We need to buy AA batteries and a braided USB-C cable on Amazon", 'Household')}
          disabled={isProcessing}
          className="px-2.5 py-1 rounded-md bg-[#161f2e] hover:bg-[#1f2b3f] border border-[#2a3852] text-gray-200 font-medium whitespace-nowrap transition text-[11px]"
        >
          🔋 Office Supplies (Batteries &amp; Cable)
        </button>
        <button
          onClick={() => triggerUtterance("Remind me to finalize the quarterly financial report before Friday", 'Oliver')}
          disabled={isProcessing}
          className="px-2.5 py-1 rounded-md bg-[#161f2e] hover:bg-[#1f2b3f] border border-[#2a3852] text-gray-200 font-medium whitespace-nowrap transition text-[11px]"
        >
          📋 Priority Task Commitment
        </button>
      </div>

      {/* Transcript Timeline */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {dialogueHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
            <Volume2 className="w-11 h-11 text-gray-600 mb-3 animate-pulse" />
            <p className="text-sm font-semibold text-gray-300">Awaiting Ambient Voice Activity</p>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">
              Speak via the microphone, select a voice stream sample above, or enter spoken dialogue below.
            </p>
          </div>
        ) : (
          dialogueHistory.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border transition animate-slide-in ${
                item.hasAction
                  ? 'bg-gradient-to-r from-[#191f2c] to-[#141b26] border-[#FF9900]/40 hover:border-[#FF9900]/70'
                  : 'bg-[#131a24]/70 border-[#1e293b] hover:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      item.speaker === 'Oliver' ? 'bg-[#FF9900]' : 'bg-[#00CAFF]'
                    }`}
                  />
                  <span className="font-semibold text-gray-200">{item.speaker}</span>
                  <span className="text-gray-500 text-[10px] flex items-center gap-1 font-mono">
                    <Clock className="w-2.5 h-2.5" /> {item.timestamp}
                  </span>
                </div>
                {item.hasAction && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FF9900]/15 text-[#FF9900] border border-[#FF9900]/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Intent Detected
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-100 leading-relaxed pl-3.5 border-l-2 border-[#293548]">
                &ldquo;{item.text}&rdquo;
              </p>
            </div>
          ))
        )}
      </div>

      {/* Bottom Voice & Text Bar */}
      <div className="p-3.5 bg-[#141c28] border-t border-[#1e293b]">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <select
            value={speaker}
            onChange={(e) => setSpeaker(e.target.value)}
            className="bg-[#0d121a] text-xs text-gray-200 border border-[#263449] rounded-lg px-2.5 py-2.5 focus:outline-none focus:border-[#FF9900]"
          >
            <option value="Oliver">Oliver (Wearable)</option>
            <option value="Household">Household</option>
            <option value="Colleague">Colleague</option>
          </select>

          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Speak or type ambient dialogue (e.g., 'We're out of oat milk')..."
              disabled={isProcessing}
              className="w-full bg-[#0d121a] text-sm text-white placeholder-gray-500 rounded-lg pl-3.5 pr-10 py-2 border border-[#263449] focus:outline-none focus:border-[#FF9900] transition"
            />
            <button
              type="submit"
              disabled={isProcessing || !inputText.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-[#FF9900] disabled:opacity-30 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={toggleListening}
            className={`px-3 py-2.5 rounded-lg border font-semibold text-xs flex items-center gap-1.5 transition ${
              isListening
                ? 'bg-red-500/20 border-red-500 text-red-300 animate-pulse'
                : 'bg-[#1c2636] hover:bg-[#253247] border-[#2e3d54] text-gray-200'
            }`}
            title={isListening ? 'Stop Voice Capture' : 'Capture Live Microphone Speech'}
          >
            {isListening ? (
              <Mic className="w-4 h-4 text-red-400 animate-pulse" />
            ) : (
              <Mic className="w-4 h-4 text-[#FF9900]" />
            )}
            <span className="hidden sm:inline">{isListening ? 'Listening' : 'Live Mic'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
