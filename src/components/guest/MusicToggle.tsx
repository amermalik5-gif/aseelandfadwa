"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

const SRC = "/audio/music.mp3";

export function MusicToggle() {
  const t = useTranslations("music");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [available, setAvailable] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(SRC, { method: "HEAD" })
      .then((r) => {
        if (!cancelled && r.ok) setAvailable(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      audioRef.current?.pause();
    };
  }, []);

  if (!available) return null;

  function toggle() {
    if (!audioRef.current) {
      audioRef.current = new Audio(SRC);
      audioRef.current.loop = true;
    }
    const audio = audioRef.current;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? t("pause") : t("play")}
      className="fixed bottom-4 z-40 flex size-11 items-center justify-center rounded-full border border-ink-soft/30 bg-paper/85 text-ink-soft shadow-sm backdrop-blur-sm transition-colors hover:text-ink ltr:right-4 rtl:left-4"
    >
      {playing ? (
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
          <path d="M11 4h-2a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1Zm-1.5 14.5v-13h1v13h-1Z" />
          <path d="M16 4h-2a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1Zm-1.5 14.5v-13h1v13h-1Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
          <path d="M12 3.5c0-.4-.5-.7-.9-.4L6.6 6.5H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h2.6l4.5 3.4c.4.3.9 0 .9-.4v-17Z" />
          <path d="M15.5 8.6a.75.75 0 0 1 1.06 0 4.8 4.8 0 0 1 0 6.8.75.75 0 1 1-1.06-1.07 3.3 3.3 0 0 0 0-4.66.75.75 0 0 1 0-1.06Z" />
          <path d="M17.8 6.3a.75.75 0 0 1 1.06 0 8.05 8.05 0 0 1 0 11.4.75.75 0 1 1-1.06-1.06 6.55 6.55 0 0 0 0-9.28.75.75 0 0 1 0-1.06Z" />
        </svg>
      )}
    </button>
  );
}
