import { Fragment } from "react";

export function Wordmark({ className = "", size = "sm" }: { className?: string; size?: "sm" | "lg" }) {
  const lg = size === "lg";
  return (
    <span className={`inline-flex flex-col items-center leading-none select-none ${className}`} aria-label="NA TERENIE — MOTO/QUAD">
      <svg
        viewBox="0 0 140 26"
        className={lg ? "h-[24px] w-[154px] sm:h-[28px] sm:w-[172px]" : "h-[16px] w-[104px] sm:h-[21px] sm:w-[132px]"}
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4 23 L26 9 L39 17 L64 2 L90 15 L112 5 L136 23 L119 23 L112 16 L101 23 L90 23 L82 17 L64 9 L52 19 L46 23 L39 18 L26 15 L14 23 Z"
          fill="#f5b700"
        />
        <path d="M64 2 L74 13 L68 15 L64 9 Z" fill="#ffca28" />
        <path d="M112 5 L122 16 L116 17 L112 14 Z" fill="#ffca28" />
        <path d="M26 9 L33 16 L28 17 L26 15 Z" fill="#ffca28" />
        <path d="M2 24 L138 24 L135 25.6 L4 25.6 Z" fill="#f5b700" opacity="0.88" />
      </svg>
      <span
        className={`mt-0.5 inline-flex items-baseline font-display font-bold italic uppercase leading-none tracking-[0.04em] ${
          lg ? "text-2xl sm:text-[1.75rem]" : "text-[1.05rem] sm:text-[1.35rem]"
        }`}
      >
        <span className="text-[#f5f5f4]">NA</span>
        <span className="ml-1 text-amber">TERENIE</span>
      </span>
      <span className={`mt-0.5 block bg-amber ${lg ? "h-[2.5px] w-full" : "h-[2px] w-[96%]"}`} aria-hidden="true" />
    </span>
  );
}

/** Two-tone heading: ["setup ", "keyword", " tail?"] — setup in white, keyword in amber. */
export function SplitTitle({ parts, as: Tag = "h2", className = "h2" }: { parts: string[]; as?: "h1" | "h2"; className?: string }) {
  return (
    <Tag className={`display ${className}`}>
      {parts.map((p, i) => (
        <Fragment key={i}>{i % 2 === 1 ? <span className="accent">{p}</span> : p}</Fragment>
      ))}
    </Tag>
  );
}

/** Deterministic topographic rings: decorative geometry for the off-road world. */
export function Contours({ className = "", rings = 16, seed = 1 }: { className?: string; rings?: number; seed?: number }) {
  const paths: string[] = [];
  for (let i = 1; i <= rings; i++) {
    const base = 40 + i * 24;
    const pts: string[] = [];
    const steps = 96;
    for (let s = 0; s <= steps; s++) {
      const t = (s / steps) * Math.PI * 2;
      const wob = 1 + 0.09 * Math.sin(3 * t + seed + i * 0.22) + 0.05 * Math.sin(5 * t - seed * 1.7 + i * 0.12) + 0.03 * Math.sin(8 * t + i * 0.3);
      const x = 600 + Math.cos(t) * base * wob * 1.35;
      const y = 400 + Math.sin(t) * base * wob;
      pts.push(`${s === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    paths.push(pts.join(" ") + " Z");
  }
  return (
    <svg className={className} viewBox="0 0 1200 800" fill="none" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {paths.map((d, i) => (
        <path key={i} d={d} stroke="currentColor" strokeWidth={i % 4 === 0 ? 1.6 : 1} opacity={i % 4 === 0 ? 0.9 : 0.5} />
      ))}
    </svg>
  );
}

export function formatPhoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

