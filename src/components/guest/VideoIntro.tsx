"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";

const SRC = "/intro.mp4";
const SCRUB_END = 0.8; // first 80% of the track maps onto the full video
const FADE_START = 0.85; // last 15% fades/scales the video away

export function VideoIntro() {
  const t = useTranslations("hero");
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Static banner: CSS collapses the track; no scrub handler at all.
      return;
    }

    // iOS/mobile refuse to decode seeked frames until playback has started
    // once; prime with a muted play()+pause() (allowed without a gesture).
    let primed = false;
    const prime = () => {
      if (primed) return;
      const p = video.play();
      if (p) {
        p.then(() => {
          video.pause();
          video.currentTime = 0.001;
          primed = true;
        }).catch(() => {});
      }
    };
    prime();
    const retryPrime = () => prime();
    window.addEventListener("touchstart", retryPrime, { passive: true, once: true });
    window.addEventListener("scroll", retryPrime, { passive: true, once: true });

    let pending = false;

    const render = () => {
      pending = false;
      const rect = section.getBoundingClientRect();
      const track = rect.height - window.innerHeight;
      if (track <= 0) return;
      const p = Math.min(1, Math.max(0, -rect.top / track));

      // Map the first 80% of the track linearly onto the timeline, hold the
      // final frame afterwards. Never seek into the very end ("ended" state).
      const dur = video.duration;
      if (Number.isFinite(dur) && dur > 0) {
        const target = Math.min(
          dur - 0.05,
          (Math.min(p, SCRUB_END) / SCRUB_END) * dur
        );
        if (!video.seeking && Math.abs(video.currentTime - target) > 0.01) {
          video.currentTime = target;
        }
      }

      // Fade out / scale down / round corners over the last 15%.
      const f = Math.min(1, Math.max(0, (p - FADE_START) / (1 - FADE_START)));
      video.style.opacity = String(1 - f);
      video.style.transform = `scale(${1 - 0.08 * f})`;
      video.style.borderRadius = `${28 * f}px`;

      if (hintRef.current) {
        hintRef.current.style.opacity = p > 0.05 ? "0" : "1";
      }
    };

    const schedule = () => {
      if (!pending) {
        pending = true;
        requestAnimationFrame(render);
      }
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    video.addEventListener("loadedmetadata", schedule);
    video.addEventListener("seeked", schedule);
    render();

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("touchstart", retryPrime);
      window.removeEventListener("scroll", retryPrime);
      video.removeEventListener("loadedmetadata", schedule);
      video.removeEventListener("seeked", schedule);
    };
  }, []);

  return (
    <section ref={sectionRef} className="intro-track relative bg-paper">
      <div className="intro-sticky top-0 flex items-center justify-center overflow-hidden bg-paper">
        <video
          ref={videoRef}
          src={SRC}
          muted
          playsInline
          preload="auto"
          aria-label={
            locale === "ar"
              ? "فيديو مصوّر لدعوة زفاف أصيل وفدوى"
              : "Illustrated wedding invitation video for Aseel & Fadwa"
          }
          className="h-full w-full object-cover"
          style={{ willChange: "transform, opacity" }}
        />
        <div
          ref={hintRef}
          className="intro-hint absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1 text-ink-soft/90 transition-opacity duration-500"
          aria-hidden="true"
        >
          <span className="tracked text-[9px]">{t("scroll")}</span>
          <svg viewBox="0 0 16 16" className="bob size-4" fill="none">
            <path
              d="M3 6l5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
