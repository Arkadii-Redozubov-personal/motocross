# PRODUCT.md — MOTO/QUAD TEREN

## Product Overview
Off-road quad (ATV) and enduro motorcycle rental platform operating in Poland (`Europe/Warsaw`):
- **Wrocław & Lower Silesia** (weekdays + Sunday, `09:00–18:00`) — training field & former polygon, sand quarry, forest river, motocross track.
- **Poznań** (Saturdays, `09:00–18:00`) — Saturday off-road riding zone.
- **Fleet (MVP seeded):** 4 quads (`3 × Segway Snarler AT5L` 2-seater EPS, `1 × TGB 4x4`) + 7 motorcycles (`3 × Enduro 250 Economy`, `3 × Enduro Standard`, `1 × Enduro 300 Start` flagged `beginner`).
- **Booking Model:** Preliminary booking requests (`NEW`) without blocking slots; owner confirms (`CONFIRMED`) or rejects (`REJECTED`) in `/admin`. Confirmation allocates individual physical assets in an atomic transaction (`[start, end)` half-open intervals) to prevent double-booking.
- **Languages:** Polish (`pl`, default), Ukrainian (`uk`), Russian (`ru`) with preserved booking query parameters on switch.
- **Contacts:** `+48 729 497 816`, `@cross_wroclaw` on Instagram.

## Brand & Content Constraints
- No unverified legal/insurance promises; state clearly what is included (briefing, helmet, gloves, full tank, no driver's license required).
- Only `enduro-300-start` carries the "beginner" badge unless changed by the owner in `/admin`.
- Public API never exposes other customers' personal data; `/admin` is single-owner cookie-authenticated with CSRF protection.

