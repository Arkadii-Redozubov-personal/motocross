"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import type { GalleryItem } from "@/server/services/settings";
import type { Locale } from "@/shared/i18n/config";
import type { Dict } from "@/shared/i18n/dictionaries/pl";

export function GalleryGrid({ items, d, locale }: { items: GalleryItem[]; d: Dict; locale: Locale }) {
  const ref = useRef<HTMLDialogElement>(null);
  const vidRef = useRef<HTMLVideoElement>(null);
  const [curIdx, setCurIdx] = useState<number>(-1);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const cur = curIdx >= 0 && curIdx < items.length ? items[curIdx] : null;

  function togglePlay() {
    const v = vidRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  function toggleMute() {
    const v = vidRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  if (items.length === 0) return <p className="text-fg-2">{d.gallery.empty}</p>;

  return (
    <>
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="relative flex flex-col overflow-hidden rounded-card border border-line bg-card">
            <div className="relative aspect-[9/16] w-full bg-card-2">
              <video
                ref={vidRef}
                src="/media/ig/reel-quad-trail.mp4"
                poster="/media/ig/reel-quad-poster.webp"
                playsInline
                loop
                muted={muted}
                preload="metadata"
                onEnded={() => setPlaying(false)}
                className="h-full w-full object-contain bg-black"
              />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={playing ? d.gallery.pause : d.gallery.play}
                  className="inline-flex min-h-10 items-center gap-2 rounded-ctl bg-amber px-3 font-display text-sm font-semibold uppercase tracking-wider text-ink"
                >
                  {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                  {playing ? d.gallery.pause : d.gallery.play}
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={muted ? d.gallery.unmute : d.gallery.mute}
                  className="grid size-10 place-items-center rounded-ctl border border-line bg-obsidian/85 text-fg hover:border-amber hover:text-amber"
                >
                  {muted ? <VolumeX size={18} aria-hidden="true" /> : <Volume2 size={18} aria-hidden="true" />}
                </button>
              </div>
            </div>
            <div className="border-t border-line p-4">
              <h3 className="h3">{d.gallery.reelTitle}</h3>
              <p className="mt-1 text-sm text-fg-2">{d.gallery.reelCaption}</p>
            </div>
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:col-span-8 lg:gap-4">
          {items.slice(0, 9).map((g, i) => (
            <li key={g.id} className={i === 0 ? "col-span-2 sm:col-span-2 sm:row-span-2" : ""}>
              <button
                type="button"
                onClick={() => { setCurIdx(i); ref.current?.showModal(); }}
                className={`group relative block w-full overflow-hidden rounded-card border border-line bg-card ${i === 0 ? "aspect-[16/10] sm:aspect-auto sm:h-full" : "aspect-[4/3]"}`}
                aria-label={`${d.gallery.open}: ${g.alt[locale]}`}
              >
                <Image
                  src={g.src}
                  alt={g.alt[locale]}
                  fill
                  sizes="(min-width:1024px) 25vw, 48vw"
                  className={`object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] ${g.src.includes("fleet-pinned") || g.src.includes("rider-raven") ? "object-top" : "object-center"}`}
                />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <dialog
        ref={ref}
        className="m-auto max-h-[92vh] max-w-[min(96vw,1100px)] bg-transparent p-0 text-fg"
        onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}
        aria-label={cur?.alt[locale]}
      >
        {cur && (
          <div className="relative">
            <img src={cur.src} alt={cur.alt[locale]} className="max-h-[84vh] w-auto max-w-full rounded-card object-contain" />
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label={d.gallery.close}
              className="absolute right-2 top-2 grid size-11 place-items-center rounded-ctl bg-obsidian/90 text-fg hover:text-amber"
            >
              <X size={20} aria-hidden="true" />
            </button>
            {items.length > 1 && (
              <div className="mt-3 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setCurIdx((i) => (i - 1 + items.length) % items.length)}
                  aria-label={d.gallery.prev}
                  className="btn btn-ghost !min-h-10 bg-obsidian/90"
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>
                <p className="text-center text-sm text-fg-2">{cur.alt[locale]}</p>
                <button
                  type="button"
                  onClick={() => setCurIdx((i) => (i + 1) % items.length)}
                  aria-label={d.gallery.next}
                  className="btn btn-ghost !min-h-10 bg-obsidian/90"
                >
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
