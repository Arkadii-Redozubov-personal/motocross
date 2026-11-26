import { Fragment } from "react";

export function Wordmark({ className = "", size = "sm" }: { className?: string; size?: "sm" | "lg" }) {
  const lg = size === "lg";
  return (
    <span className={`inline-flex flex-col items-center leading-none select-none ${className}`} aria-label="MOTOCROSS WRO — @motocross.wro">
      <svg
        viewBox="0 0 148 26"
        className={lg ? "h-[24px] w-[166px] sm:h-[28px] sm:w-[186px]" : "h-[16px] w-[112px] sm:h-[21px] sm:w-[144px]"}
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 23 L32 6 L45 16 L72 2 L98 16 L118 7 L142 23 L121 23 L114 16 L98 23 L84 16 L72 10 L54 23 L42 15 L26 23 Z"
          fill="#f5b700"
        />
        <path d="M72 2 L82 12 L75 14 L72 10 Z" fill="#ffca28" />
        <path d="M32 6 L40 15 L34 16 L32 12 Z" fill="#ffca28" />
        <path d="M2 24 L146 24 L143 25.6 L5 25.6 Z" fill="#f5b700" opacity="0.88" />
      </svg>
      <span
        className={`mt-0.5 inline-flex items-baseline font-display font-bold italic uppercase leading-none tracking-[0.04em] ${
          lg ? "text-2xl sm:text-[1.75rem]" : "text-[1.05rem] sm:text-[1.32rem]"
        }`}
      >
        <span className="text-[#f5f5f4]">MOTOCROSS</span>
        <span className="text-amber">.WRO</span>
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

