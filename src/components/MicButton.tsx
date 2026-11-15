import { useEffect, useRef, useState } from "react";
import { listen, speechSupported } from "../lib/voice.ts";
import { cx } from "./ui.tsx";

/** Tap, speak, done. Hidden when the browser cannot listen. */
export default function MicButton({ onText, onProblem, label = "Speak" }: { onText: (text: string) => void; onProblem?: (msg: string | null) => void; label?: string }) {
  const [on, setOn] = useState(false);
  const stop = useRef<(() => void) | null>(null);
  useEffect(() => () => stop.current?.(), []);

  if (!speechSupported()) return null;

  function toggle() {
    if (on) {
      stop.current?.();
      return;
    }
    onProblem?.(null);
    setOn(true);
    stop.current = listen({
      onText,
      onEnd: (err) => {
        setOn(false);
        if (err === "not-allowed" || err === "service-not-allowed") onProblem?.("Allow the microphone to speak.");
        else if (err === "no-speech") onProblem?.("Didn't hear anything. Tap and try again.");
      },
    });
  }

  return (
    <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        aria-label={on ? "Stop listening" : label}
        className={cx(
          "grid size-12 shrink-0 place-items-center rounded-2xl text-xl ring-1 transition",
          on ? "animate-pulse bg-spinach text-white ring-spinach" : "bg-white ring-black/10",
        )}
      >
        🎙
      </button>
  );
}
