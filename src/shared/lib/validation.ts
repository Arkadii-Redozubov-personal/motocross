import { z } from "zod";

const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()\-]{7,22}$/, "phone")
  .refine((v) => v.replace(/\D/g, "").length >= 7 && v.replace(/\D/g, "").length <= 15, "phone");

export const bookingInput = z.object({
  locationId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  durationMin: z.number().int().positive(),
  modelId: z.number().int().positive(),
  qty: z.number().int().min(1).max(20),
  addons: z.array(z.string().max(40)).max(10).default([]),
  name: z.string().trim().min(2).max(100),
  phone,
  email: z.union([z.literal(""), z.string().trim().email().max(150)]).optional(),
  comment: z.string().trim().max(1000).optional().default(""),
  consent: z.literal(true),
  idempotencyKey: z.string().min(8).max(80),
  lang: z.enum(["pl", "uk", "ru"]).default("pl"),
  utm: z.record(z.string().max(120)).optional(),
  website: z.string().max(0).optional(), // honeypot
});
export type BookingInput = z.infer<typeof bookingInput>;

export const loginInput = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(200) });
export const passwordInput = z.object({ current: z.string().min(1), next: z.string().min(10).max(200) });

const l3 = z.object({ pl: z.string().max(2000), uk: z.string().max(2000), ru: z.string().max(2000) });
const mediaPath = z.string().max(300).refine((v) => v === "" || /^\/(media|uploads)\/[\w./-]+$/.test(v) && !v.includes(".."), "path");
const url = z.union([z.literal(""), z.string().url().max(300)]);

export const contentInput = z.object({
  contact: z.object({
    phone: z.string().trim().max(30),
    email: z.union([z.literal(""), z.string().email().max(150)]),
    ownerEmail: z.union([z.literal(""), z.string().email().max(150)]),
    instagramUrl: url,
    facebookUrl: url,
  }),
  texts: z.object({ heroTitle: l3, heroSubtitle: l3 }),
  promo: z.object({ enabled: z.boolean(), title: l3, body: l3 }),
  gallery: z.array(z.object({ id: z.string().max(40), src: mediaPath, alt: l3, visible: z.boolean() })).max(40),
});
export type ContentInput = z.infer<typeof contentInput>;

const hm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const scheduleInput = z.object({
  locations: z.array(z.object({
    id: z.number().int().positive(),
    active: z.boolean(),
    address_pl: z.string().max(300), address_uk: z.string().max(300), address_ru: z.string().max(300),
  })),
  schedules: z.array(z.object({ location_id: z.number().int(), weekday: z.number().int().min(0).max(6), is_open: z.boolean(), open_time: hm, close_time: hm })),
  exceptions: z.array(z.object({ location_id: z.number().int(), date_ymd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), is_open: z.boolean(), open_time: hm, close_time: hm, note: z.string().max(200) })),
});

export const modelInput = z.object({
  id: z.number().int().positive().optional(),
  slug: z.string().regex(/^[a-z0-9-]{2,50}$/),
  category: z.enum(["quad", "moto"]),
  title: l3, desc: l3, specs: l3,
  beginner_flag: z.boolean(),
  image_url: mediaPath,
  published: z.boolean(),
  sort_order: z.number().int(),
  rates: z.array(z.object({ duration_min: z.number().int().positive().max(1440), amount_pln: z.number().int().min(0).max(100000) })).min(1).max(8),
});

export const assetInput = z.object({
  id: z.number().int().positive().optional(),
  code: z.string().trim().min(2).max(30),
  model_id: z.number().int().positive(),
  location_id: z.number().int().positive().nullable(),
  active: z.boolean(),
});

export const addonInput = z.object({
  id: z.number().int().positive(),
  title: l3,
  pricing_mode: z.enum(["per_hour", "flat"]),
  amount_pln: z.number().int().min(0).max(100000),
  active: z.boolean(),
});

export const statusInput = z.object({ action: z.enum(["confirm", "reject", "cancel"]) });
