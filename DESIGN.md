# DESIGN.md — MOTO/QUAD TEREN

## Color System (Warm Asphalt + Crisp White Alternation)
- **Dark Surfaces:**
  - `--color-obsidian`: `#1c1d21` (primary warm asphalt ground: header, hero, banners, alternating sections, `/booking`, `/admin`)
  - `--color-slate-deep`: `#25272c` (secondary gunmetal surface, e.g. `/gallery` media frame)
  - `--color-card`: `#2d3036` / `--color-card-2`: `#353840` on dark sections
  - `--color-fg`: `#f5f5f4` · `--color-fg-2`: `#cfd2d8` · `--color-fg-3`: `#a3a7b0` · `--color-line`: `rgb(245 245 244 / 0.13)`
- **Light Editorial Surfaces (`.surface-light`, `.surface-paper`):**
  - `.surface-light`: `#ffffff` pure white background with `--color-card: #f6f6f4` cards (fleet sections, city schedule, gallery reviews, how-to steps, `/privacy`)
  - `.surface-paper`: `#f3f4f2` warm paper background with `--color-card: #ffffff` cards (FAQ accordion on `/contact`)
  - Light ink overrides: `--color-fg: #141518` · `--color-fg-2`: `#3d414a` · `--color-fg-3`: `#5b606c` · `--color-line`: `rgb(20 21 24 / 0.13)`
- **Brand Accents:**
  - `--color-amber`: `#f5b700` (primary CTA fill with `#141518` ink, active tabs, conversion strip)
  - `--color-amber-hi`: `#ffca28` (hover state)
  - `--color-amber-text`: `#f5b700` on dark surfaces, switching to deep golden ochre `#946200` (`>= 4.9:1` AA contrast) on `.surface-light` and `.surface-paper`
  - `--color-flame`: `#e26d38` (`Dla początkujących` badge & terrain markers)
  - `--color-danger`: `#ff7a6b` · `--color-ok`: `#5fd08a`

## Typography
- **Display (Public Persuade):** `Oswald` (`500`, `600`, `700`), uppercase, tight leading (`1.02`), split white/ink + amber/ochre phrasing.
- **Body & Operate UI (`/admin`):** `Onest` (`400`, `500`, `600`, `700`), `font-variant-numeric: tabular-nums` (`.num`) on prices, dates, slots, and phone numbers.

## Geometry & Components
- Control radius: `4px` (`--radius-ctl`); Card radius: `12px` (`--radius-card`); 1px borders without wide drop-shadows.
- Angled hero photo frames (`.cut`, `.cut-sm`), diamond tread cells (`.diamond`), deterministic SVG topographic contours (`<Contours />`).
- Browser surfaces themed in `globals.css`: custom `::selection`, `caret-color`, `:focus-visible`, and dark scrollbar.
