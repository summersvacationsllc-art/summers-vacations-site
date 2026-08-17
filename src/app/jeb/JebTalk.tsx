"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { openingGreeting } from "@/lib/jeb";

type Turn = { role: "jeb" | "guest"; text: string };

function pickRecorderMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const type of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"]) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

function micFailHint(err: unknown): string {
  const name = err instanceof Error ? err.name : "";
  const msg = err instanceof Error ? err.message : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError" || /denied|not allowed/i.test(msg)) {
    return "This device blocked the microphone. Allow the mic for mybransonvacation.com, then tap again — or type below.";
  }
  if (name === "NotFoundError") {
    return "No microphone on this device. Type your question below.";
  }
  return "Mic didn't open. Type your question below.";
}

async function speakJeb(text: string, audioRef: HTMLAudioElement | null) {
  try {
    const res = await fetch("/api/jeb/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.ok && audioRef) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioRef.src = url;
      await audioRef.play().catch(() => {});
      return;
    }
  } catch {
    /* browser voice below */
  }
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.05;
  u.pitch = 0.9;
  const voices = window.speechSynthesis.getVoices();
  const male =
    voices.find((v) => /en-US/i.test(v.lang) && /male|daniel|fred|david|google us/i.test(v.name)) ||
    voices.find((v) => /en/i.test(v.lang));
  if (male) u.voice = male;
  window.speechSynthesis.speak(u);
}

export default function JebTalk() {
  const params = useSearchParams();
  const name = (params.get("name") || "").trim().split(/\s+/)[0] || "";
  const unit = (params.get("unit") || "").trim().toLowerCase();
  const fromKiosk = params.get("from") === "kiosk" || Boolean(unit);

  const [turns, setTurns] = useState<Turn[]>(() => [{ role: "jeb", text: openingGreeting(name) }]);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [hint, setHint] = useState("Tap the microphone each time you want to speak.");
  const listRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const greeted = useRef(false);

  const backHref = fromKiosk
    ? unit
      ? `/kiosk.html?unit=${encodeURIComponent(unit)}`
      : "/kiosk.html"
    : "/";

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  useEffect(() => {
    if (greeted.current) return;
    greeted.current = true;
    const t = window.setTimeout(() => {
      void speakJeb(openingGreeting(name), audioRef.current);
    }, 400);
    return () => window.clearTimeout(t);
  }, [name]);

  const askJeb = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || busy) return;
      setBusy(true);
      setHint("Jeb's thinkin'…");
      setTurns((prev) => [...prev, { role: "guest", text: q }]);
      const history = [...turns, { role: "guest" as const, text: q }].map((t) => ({
        role: t.role === "jeb" ? ("assistant" as const) : ("user" as const),
        content: t.text,
      }));
      try {
        const res = await fetch("/api/jeb", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, name, unit }),
        });
        const data = (await res.json()) as { ok?: boolean; reply?: string; error?: string };
        const reply =
          data.ok && data.reply
            ? data.reply
            : data.error ||
              "Bless your heart, I lost the signal. Try again, or text Brian at 314-565-0589.";
        setTurns((prev) => [...prev, { role: "jeb", text: reply }]);
        setHint("Tap the microphone each time you want to speak.");
        setBusy(false);
        void speakJeb(reply, audioRef.current);
      } catch {
        const fallback = "Line went quiet on me. Tap that mic again, or text Brian at 314-565-0589.";
        setTurns((prev) => [...prev, { role: "jeb", text: fallback }]);
        setHint("Tap the microphone each time you want to speak.");
      } finally {
        setBusy(false);
      }
    },
    [busy, name, turns, unit]
  );

  const stopMedia = () => {
    const rec = mediaRef.current;
    mediaRef.current = null;
    if (rec && rec.state !== "inactive") rec.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const finishClip = async (blob: Blob) => {
    if (blob.size < 800) {
      setHint("Didn't catch that — tap the mic, talk, then tap again.");
      setBusy(false);
      return;
    }
    setHint("Makin' sure I heard you…");
    const fd = new FormData();
    const ext = blob.type.includes("mp4") || blob.type.includes("aac") ? "m4a" : "webm";
    fd.append("file", blob, `speech.${ext}`);
    const res = await fetch("/api/jeb/listen", { method: "POST", body: fd });
    const data = (await res.json()) as { ok?: boolean; text?: string; error?: string };
    if (data.ok && data.text) {
      await askJeb(data.text);
      return;
    }
    setHint(data.error || "Didn't catch that — tap the mic and try again.");
    setBusy(false);
  };

  const startMediaRec = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    streamRef.current = stream;
    const mime = pickRecorderMime();
    const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    chunksRef.current = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      const blob = new Blob(chunksRef.current, { type: rec.mimeType || mime || "audio/webm" });
      void finishClip(blob);
    };
    mediaRef.current = rec;
    rec.start(250);
    setListening(true);
    setHint("I'm listenin' — tap the mic again when you're done.");
  };

  const toggleMic = async () => {
    if (busy && !listening) return;
    if (listening) {
      setListening(false);
      stopMedia();
      return;
    }
    if (typeof window !== "undefined") {
      window.speechSynthesis?.cancel();
      audioRef.current?.pause();
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setHint("This browser has no microphone. Type your question below.");
      return;
    }
    setHint("Openin' the microphone…");
    try {
      await startMediaRec();
    } catch (err) {
      setListening(false);
      setHint(micFailHint(err));
    }
  };

  const onType = (e: FormEvent) => {
    e.preventDefault();
    const q = typed;
    setTyped("");
    void askJeb(q);
  };

  return (
    <main className="min-h-dvh bg-[#f0f9ff] text-[#0c4a6e] flex flex-col">
      <audio ref={audioRef} preload="none" />
      <header className="flex items-center gap-3 px-4 py-3 border-b border-sky-200 bg-white/90 backdrop-blur">
        <Link
          href={backHref}
          className="text-sm font-bold text-[#0369a1] no-underline px-3 py-2 rounded-full border border-sky-200 bg-white"
        >
          ← Back
        </Link>
        <div className="min-w-0">
          <div className="font-display text-lg font-semibold leading-tight">Talk to Jeb</div>
          <div className="text-xs text-[#0369a1]">My Branson Vacation concierge</div>
        </div>
      </header>

      <div className="px-4 pt-5 flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/jeb/portrait.jpg"
          alt="Jebediah"
          className="w-28 h-28 rounded-full object-cover object-[center_18%] border-4 border-white shadow-lg shadow-sky-900/15"
        />
        <h1 className="font-display text-3xl mt-3 mb-1">Jebediah</h1>
        <p className="text-sm text-[#0369a1]">Folks call him Jeb</p>
        <p className="mt-3 max-w-md text-sm font-semibold bg-white border border-sky-200 rounded-2xl px-4 py-3">
          Tap the microphone button each time you want to speak.
        </p>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {turns.map((t, i) => (
          <div
            key={`${t.role}-${i}`}
            className={`max-w-[34rem] mx-auto rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
              t.role === "jeb"
                ? "bg-white border border-sky-200 text-[#0c4a6e]"
                : "bg-[#0284c7] text-white ml-auto"
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-wide opacity-70 mb-1">
              {t.role === "jeb" ? "Jeb" : "You"}
            </div>
            {t.text}
          </div>
        ))}
        {busy && !listening && (
          <div className="max-w-[34rem] mx-auto text-sm text-[#0369a1] font-semibold">Jeb's thinkin'…</div>
        )}
      </div>

      <div className="px-4 pb-5 pt-2 bg-gradient-to-t from-[#f0f9ff] via-[#f0f9ff] to-transparent">
        <p className="text-center text-sm font-semibold text-[#0369a1] mb-3">{hint}</p>
        <div className="flex justify-center mb-3">
          <button
            type="button"
            onClick={() => void toggleMic()}
            disabled={busy && !listening}
            aria-pressed={listening}
            aria-label={listening ? "Stop listening" : "Tap to speak"}
            className={`w-24 h-24 rounded-full text-white text-4xl border-4 border-white shadow-xl shadow-sky-900/20 disabled:opacity-50 ${
              listening ? "bg-rose-600 animate-pulse" : "bg-gradient-to-br from-[#0ea5e9] to-[#0284c7]"
            }`}
          >
            {listening ? "■" : "🎤"}
          </button>
        </div>
        <form onSubmit={onType} className="max-w-xl mx-auto flex gap-2">
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Or type a question…"
            className="flex-1 rounded-full border border-sky-200 px-4 py-3 text-base bg-white outline-none focus:border-[#0284c7]"
          />
          <button
            type="submit"
            disabled={busy || !typed.trim()}
            className="rounded-full bg-[#0284c7] text-white font-bold px-5 py-3 disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}
