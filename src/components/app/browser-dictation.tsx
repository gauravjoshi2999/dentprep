import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

type RecognitionResultEvent = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; [index: number]: { transcript: string } }>;
};
type RecognitionErrorEvent = { error: string };
type BrowserRecognizer = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type RecognitionWindow = Window & {
  SpeechRecognition?: new () => BrowserRecognizer;
  webkitSpeechRecognition?: new () => BrowserRecognizer;
};

function browserRecognizer() {
  if (typeof window === "undefined") return undefined;
  const speechWindow = window as RecognitionWindow;
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

/**
 * Browser-managed one-turn speech-to-text input; does not record or upload raw
 * audio to DentPrep. Some browsers use remote transcription providers, so the
 * user must opt in explicitly before starting microphone capture.
 */
export function BrowserDictation({
  onTranscript,
  disabled = false,
}: {
  onTranscript: (transcript: string) => void;
  disabled?: boolean;
}) {
  const [supported, setSupported] = useState(false);
  const [consent, setConsent] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const active = useRef<BrowserRecognizer | null>(null);

  useEffect(() => {
    setSupported(Boolean(browserRecognizer()));
    return () => {
      active.current?.abort();
      active.current = null;
    };
  }, []);
  useEffect(() => {
    if (disabled && active.current) {
      active.current.abort();
      active.current = null;
      setListening(false);
    }
  }, [disabled]);

  function stop() {
    active.current?.stop();
    setListening(false);
  }
  function start() {
    if (!consent || disabled || listening) return;
    const Recognizer = browserRecognizer();
    if (!Recognizer) return;
    const recognizer = new Recognizer();
    recognizer.lang = "en-IN";
    recognizer.continuous = false;
    recognizer.interimResults = false;
    recognizer.onresult = (event) => {
      const spoken: string[] = [];
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result?.isFinal && result[0]?.transcript) spoken.push(result[0].transcript.trim());
      }
      const text = spoken.join(" ").trim();
      if (text) onTranscript(text);
    };
    recognizer.onerror = (event) => {
      setError(event.error === "not-allowed"
        ? "Microphone permission was denied. You can keep typing your answer."
        : "Voice transcription stopped. Please try again or type your answer.");
      setListening(false);
    };
    recognizer.onend = () => {
      active.current = null;
      setListening(false);
    };
    try {
      active.current = recognizer;
      recognizer.start();
      setListening(true);
      setError("");
    } catch {
      active.current = null;
      setListening(false);
      setError("This browser could not start voice transcription. Type your answer instead.");
    }
  }

  return (
    <section className="mt-3 rounded-xl border border-border bg-muted/40 p-4" aria-label="Optional voice answer dictation">
      <div className="mb-2 flex items-center gap-2 font-bold">
        <Mic className="h-4 w-4 text-teal" aria-hidden="true" />
        <span>Optional voice-to-text answer</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Your browser may send microphone audio to its speech-recognition provider. DentPrep does not
        store the raw audio; recognized text is added to your editable answer and is saved only when
        you choose Save draft or Finish.
      </p>
      {supported ? (
        <>
          <label className="my-3 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={consent}
              disabled={disabled || listening}
              onChange={(event) => {
                setConsent(event.target.checked);
                setError("");
              }}
            />
            <span>I understand the browser speech-processing notice and choose to use my microphone.</span>
          </label>
          <Button
            type="button"
            variant="outline"
            disabled={disabled || (!consent && !listening)}
            onClick={() => listening ? stop() : start()}
          >
            {listening ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
            {listening ? "Stop dictation" : "Dictate one answer"}
          </Button>
          {listening && <p className="mt-2 text-xs font-semibold text-teal" role="status">Microphone active. Speak your answer, then stop.</p>}
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Voice dictation is not supported in this browser. Text practice remains available.</p>
      )}
      {error && <p role="alert" className="mt-2 flex items-start gap-2 text-xs text-destructive"><ShieldAlert className="h-4 w-4 shrink-0" />{error}</p>}
    </section>
  );
}
