import type { DatabaseSync } from "node:sqlite";
import { existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { hashPassword } from "../services/password";
import { one, run } from "./client";

const now = () => new Date().toISOString();

function pub(path: string): boolean {
  if (!existsSync(resolve("public"))) return true;
  return existsSync(resolve("public", path.replace(/^\//, "")));
}

type ModelSeed = {
  slug: string;
  category: "quad" | "moto";
  title: [string, string, string];
  desc: [string, string, string];
  specs: [string, string, string];
  beginner: boolean;
  image: string;
  hourly: number;
  assets: string[];
};

const MODELS: ModelSeed[] = [
  {
    slug: "quad-kymco-4x4",
    category: "quad",
    title: ["Quad KYMCO 4x4 (2-os.)", "Квадроцикл KYMCO 4x4 (двомісний)", "Квадроцикл KYMCO 4x4 (двухместный)"],
    desc: [
      "Wygodny dwuosobowy quad przeprawowy KYMCO z kufrem. Paliwo, kask i pełne wyposażenie w cenie.",
      "Зручний двомісний квадроцикл KYMCO з кофром. Пальне, шолом та повне екіпірування включені у вартість.",
      "Удобный двухместный квадроцикл KYMCO с кофром. Топливо, шлем и полная экипировка включены в цену.",
    ],
    specs: [
      "2 miejsca|Kufer bagażowy|Paliwo i strój w cenie|Bez prawa jazdy",
      "2 місця|Багажний кофр|Пальне та екіпірування в ціні|Без водійських прав",
      "2 места|Багажный кофр|Топливо и экипировка в цене|Без водительских прав",
    ],
    beginner: false,
    image: "/media/ig/quad-kymco-4x4.webp",
    hourly: 250,
    assets: ["QUAD-KYM-01", "QUAD-KYM-02", "QUAD-KYM-03"],
  },
  {
    slug: "quad-4x4-led",
    category: "quad",
    title: ["Quad terenowy 4x4 LED (2-os.)", "Позашляховий квадроцикл 4x4 LED (2-місний)", "Внедорожный квадроцикл 4x4 LED (2-местный)"],
    desc: [
      "Mocny dwuosobowy quad z belką LED na strome podjazdy kopalni piasku i trasy leśne.",
      "Потужний двомісний квадроцикл із LED-балкою для піщаних кар'єрів і лісових маршрутів.",
      "Мощный двухместный квадроцикл с LED-балкой для песчаных карьеров и лесных маршрутов.",
    ],
    specs: [
      "2 miejsca|Belka LED|Napęd 4x4|60 min czystej jazdy",
      "2 місця|LED-балка|Привід 4x4|60 хв фактичного катання",
      "2 места|LED-балка|Привод 4x4|60 мин чистого катания",
    ],
    beginner: false,
    image: "/media/ig/quad-black-led.webp",
    hourly: 250,
    assets: ["QUAD-LED-01"],
  },
  {
    slug: "pitbike-start",
    category: "moto",
    title: ["Pitbike 150 (Dla początkujących)", "Пітбайк (для початківців)", "Питбайк (для новичков)"],
    desc: [
      "Lekki i zwinny pitbike idealny na pierwszy raz oraz dla młodzieży. Uczymy od zera przed wyjazdem.",
      "Легкий і маневровий пітбайк — ідеально для першого разу та підлітків. Навчаємо з нуля перед виїздом.",
      "Лёгкий и манёвренный питбайк — идеально для первого раза и подростков. Учим с нуля перед выездом.",
    ],
    specs: [
      "Dla początkujących|Paliwo i kask w cenie|Instruktor na życzenie",
      "Для початківців|Пальне та екіпірування в ціні|Інструктор за потреби",
      "Для новичков|Топливо и шлем в цене|Инструктор по запросу",
    ],
    beginner: true,
    image: "/media/ig/moto-beginner-ride.webp",
    hourly: 150,
    assets: ["MOTO-PIT-01", "MOTO-PIT-02", "MOTO-PIT-03"],
  },
  {
    slug: "honda-crf250r",
    category: "moto",
    title: ["Krosowy Honda CRF250R", "Кросовий Honda CRF250R", "Кроссовый Honda CRF250R"],
    desc: [
      "Kultowy motocykl crossowy Honda CRF250R na piaszczyste podjazdy, poligon i szybkie zakręty.",
      "Кросовий мотоцикл Honda CRF250R для піщаних підйомів, полігону та динамічних поворотів.",
      "Кроссовый мотоцикл Honda CRF250R для песчаных подъёмов, полигона и динамичных поворотов.",
    ],
    specs: [
      "Honda CRF250R|Ochrona i buty w cenie|60 min faktycznej jazdy",
      "Honda CRF250R|Повне екіпірування в ціні|60 хв фактичного катання",
      "Honda CRF250R|Полная экипировка в цене|60 мин чистого катания",
    ],
    beginner: false,
    image: "/media/ig/moto-track-corner.webp",
    hourly: 200,
    assets: ["MOTO-HON-01", "MOTO-HON-02", "MOTO-HON-03"],
  },
  {
    slug: "yamaha-cross-250",
    category: "moto",
    title: ["Krosowy Yamaha YZ/WR", "Кросовий мотоцикл Yamaha", "Кроссовый мотоцикл Yamaha"],
    desc: [
      "Sprawdzony motocykl crossowy Yamaha do jazdy po leśnych ścieżkach i piachu pod Wrocławiem.",
      "Перевірений кросовий мотоцикл Yamaha для лісових трас і піску поблизу Вроцлава.",
      "Проверенный кроссовый мотоцикл Yamaha для лесных трасс и песка под Вроцлавом.",
    ],
    specs: [
      "Yamaha Cross|Pełne wyposażenie w cenie|Bez dopłat",
      "Yamaha Cross|Повне екіпірування в ціні|Без прихованих доплат",
      "Yamaha Cross|Полная экипировка в цене|Без скрытых доплат",
    ],
    beginner: false,
    image: "/media/ig/moto-yamaha-pov.webp",
    hourly: 200,
    assets: ["MOTO-YAM-01"],
  },
];

const GALLERY_SEED = [
  { src: "/media/ig/hero-fleet-lineup.webp", alt: { pl: "Ekipa @motocross.wro: motocykle crossowe Honda, Yamaha i quad 4x4", uk: "Техніка @motocross.wro: кросові мотоцикли Honda, Yamaha та квадроцикл", ru: "Техника @motocross.wro: кроссовые мотоциклы Honda, Yamaha и квадроцикл" } },
  { src: "/media/ig/quad-sand-quarry.webp", alt: { pl: "Jazda quadem po stromych wydmach kopalni piasku", uk: "Поїздка квадроциклом піщаним кар'єром", ru: "Поездка на квадроцикле по песчаному карьеру" } },
  { src: "/media/ig/moto-track-corner.webp", alt: { pl: "Motocykl crossowy w zakręcie na piaszczystej trasie", uk: "Кросовий мотоцикл у повороті на ґрунтовій трасі", ru: "Кроссовый мотоцикл в повороте на грунтовой трассе" } },
  { src: "/media/ig/quad-kymco-4x4.webp", alt: { pl: "Dwuosobowy quad KYMCO 4x4 gotowy na wyjazd", uk: "Двомісний квадроцикл KYMCO 4x4 готовий до виїзду", ru: "Двухместный квадроцикл KYMCO 4x4 готов к выезду" } },
  { src: "/media/ig/moto-wheelie-quarry.webp", alt: { pl: "Jazda na tylnym kole na piasku w @motocross.wro", uk: "Віллі на кросовому мотоциклі в піщаному кар'єрі", ru: "Вилли на кроссовом мотоцикле в песчаном карьере" } },
  { src: "/media/ig/quad-couple-autumn.webp", alt: { pl: "Przejażdżka we dwoje na quadzie jesiennymi szlakami", uk: "Катання вдвох на двомісному квадроциклі осіннім лісом", ru: "Катание вдвоём на двухместном квадроцикле по осеннему лесу" } },
  { src: "/media/ig/moto-3-riders-trail.webp", alt: { pl: "Trzech motocyklistów na weekendowej trasie pod Wrocławiem", uk: "Троє райдерів на вихідних на трасі біля Вроцлава", ru: "Трое райдеров на трассе под Вроцлавом в выходные" } },
  { src: "/media/ig/quad-quarry-bw.webp", alt: { pl: "Uczestniczka na quadzie 4x4 z belką LED na kopalni piasku", uk: "Учасниця на квадроциклі з LED-балкою в піщаному кар'єрі", ru: "Участница на квадроцикле с LED-балкой в песчаном карьере" } },
  { src: "/media/ig/moto-meadow-ride.webp", alt: { pl: "Wyjazd krosem przez zieloną łąkę i leśną polanę", uk: "Виїзд на кросі зеленим полем біля лісу", ru: "Выезд на кроссе по зелёному полю у леса" } },
  { src: "/media/ig/moto-weekend-group.webp", alt: { pl: "Weekendowy trening grupowy @motocross.wro", uk: "Вихідний заїзд із друзями в @motocross.wro", ru: "Выходной заезд с друзьями в @motocross.wro" } },
];

function clearSeedTables(db: DatabaseSync) {
  db.exec(`
    DELETE FROM booking_allocations;
    DELETE FROM booking_items;
    DELETE FROM rates;
    DELETE FROM assets;
    DELETE FROM vehicle_models;
    DELETE FROM schedule_exceptions;
    DELETE FROM schedules;
    DELETE FROM locations;
    DELETE FROM addons;
    DELETE FROM site_settings WHERE key != 'session_secret';
  `);
}

export function seedIfEmpty(db: DatabaseSync) {
  const has = one<{ c: number }>(db, "SELECT COUNT(*) AS c FROM locations");
  if (has && has.c > 0) {
    // Re-seed automatically if an ephemeral DB still contains old competitor data and has no bookings.
    const oldModel = one<{ id: number }>(db, "SELECT id FROM vehicle_models WHERE slug = 'segway-at5l'");
    const contactRow = one<{ value_json: string }>(db, "SELECT value_json FROM site_settings WHERE key = 'contact'");
    const bookingsCount = one<{ c: number }>(db, "SELECT COUNT(*) AS c FROM bookings")?.c ?? 0;
    const isCompetitor = Boolean(oldModel) || (contactRow?.value_json.includes("cross_wroclaw") ?? false);
    if (isCompetitor && bookingsCount === 0) {
      db.exec("BEGIN");
      try {
        clearSeedTables(db);
        insertFreshSeed(db, { keepAdmin: true });
        db.exec("COMMIT");
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
    }
    return;
  }

  db.exec("BEGIN");
  try {
    insertFreshSeed(db, { keepAdmin: false });
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

function insertFreshSeed(db: DatabaseSync, opts: { keepAdmin: boolean }) {
  // Locations from @motocross.wro Cennik:
  // - Sunday: Poligon near Wrocław (51°11'56.8"N 17°05'48.6"E)
  // - Saturday (plus Mon-Fri private min 2 people / 2h): Kopalnia piasku (50°48'45.2"N 16°34'05.5"E)
  run(db, `INSERT INTO locations (slug, city_pl, city_uk, city_ru, address_pl, address_uk, address_ru) VALUES (?,?,?,?,?,?,?)`,
    "wroclaw", "Wrocław — Poligon", "Вроцлав — Полігон", "Вроцлав — Полигон",
    "Niedziela · Poligon pod Wrocławiem · GPS: 51°11'56.8\"N 17°05'48.6\"E",
    "Неділя · Локація біля Вроцлава · GPS: 51°11'56.8\"N 17°05'48.6\"E",
    "Воскресенье · Полигон под Вроцлавом · GPS: 51°11'56.8\"N 17°05'48.6\"E");
  run(db, `INSERT INTO locations (slug, city_pl, city_uk, city_ru, address_pl, address_uk, address_ru) VALUES (?,?,?,?,?,?,?)`,
    "karier", "Kopalnia piasku", "Піщаний кар'єр", "Песчаный карьер",
    "Sobota (Pn–Pt wyjazdy prywatne min. 2 os. / 2 godz.) · GPS: 50°48'45.2\"N 16°34'05.5\"E",
    "Субота (Пн–Пт приватні виїзди мін. 2 ос. / 2 год.) · GPS: 50°48'45.2\"N 16°34'05.5\"E",
    "Суббота (Пн–Пт частные выезды мин. 2 чел. / 2 ч) · GPS: 50°48'45.2\"N 16°34'05.5\"E");

  const wro = one<{ id: number }>(db, "SELECT id FROM locations WHERE slug='wroclaw'")!.id;
  const kar = one<{ id: number }>(db, "SELECT id FROM locations WHERE slug='karier'")!.id;
  for (let wd = 0; wd <= 6; wd++) {
    run(db, "INSERT INTO schedules (location_id, weekday, is_open, open_time, close_time) VALUES (?,?,?,?,?)", wro, wd, wd === 0 ? 1 : 0, "09:00", "18:00");
    run(db, "INSERT INTO schedules (location_id, weekday, is_open, open_time, close_time) VALUES (?,?,?,?,?)", kar, wd, wd >= 1 && wd <= 6 ? 1 : 0, "09:00", "18:00");
  }

  let order = 0;
  for (const m of MODELS) {
    const image = pub(m.image) ? m.image : "";
    run(db,
      `INSERT INTO vehicle_models (slug, category, title_pl, title_uk, title_ru, desc_pl, desc_uk, desc_ru, specs_pl, specs_uk, specs_ru, beginner_flag, image_url, published, sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1,?)`,
      m.slug, m.category, ...m.title, ...m.desc, ...m.specs, m.beginner ? 1 : 0, image, order++);
    const id = one<{ id: number }>(db, "SELECT id FROM vehicle_models WHERE slug=?", m.slug)!.id;
    for (const code of m.assets) run(db, "INSERT INTO assets (code, model_id, location_id, active) VALUES (?,?,NULL,1)", code, id);
    for (const hours of [1, 2, 3]) run(db, "INSERT INTO rates (model_id, duration_min, amount_pln) VALUES (?,?,?)", id, hours * 60, m.hourly * hours);
  }

  const addon = (slug: string, t: [string, string, string], mode: string, amount: number) =>
    run(db, "INSERT INTO addons (slug, title_pl, title_uk, title_ru, pricing_mode, amount_pln) VALUES (?,?,?,?,?,?)", slug, ...t, mode, amount);
  addon("instructor", ["Instruktor podczas jazdy (w cenie)", "Інструктор за потреби (в ціні)", "Инструктор при необходимости (в цене)"], "per_hour", 0);
  addon("passenger", ["Pasażer na quadzie 2-os. (w cenie)", "Пасажир на двомісному квадроциклі (в ціні)", "Пассажир на двухместном квадроцикле (в цене)"], "per_hour", 0);
  addon("voucher", ["Voucher podarunkowy (druk / PDF)", "Подарунковий ваучер (друк / PDF)", "Подарочный ваучер (печать / PDF)"], "flat", 150);

  const gallery = GALLERY_SEED.filter((x) => pub(x.src)).map((x, i) => ({ id: `g${i + 1}`, visible: true, ...x }));

  const settings: Record<string, unknown> = {
    contact: {
      phone: "+48 729 497 816",
      email: "",
      ownerEmail: "",
      instagramUrl: "https://www.instagram.com/motocross.wro/",
      facebookUrl: "https://www.facebook.com/share/1ArnwRKLCi/?mibextid=wwXIfr",
      telegramUrl: "https://t.me/+CWxB07bbqLoyNDVi",
    },
    booking: { slotStepMin: 60, minLeadMin: 60, horizonDays: 90 },
    texts: { heroTitle: { pl: "", uk: "", ru: "" }, heroSubtitle: { pl: "", uk: "", ru: "" } },
    promo: {
      enabled: true,
      title: {
        pl: "Pn–Pt prywatne wyjazdy i vouchery prezentowe",
        uk: "Пн–Пт приватні виїзди та подарункові ваучери",
        ru: "Пн–Пт частные выезды и подарочные ваучеры",
      },
      body: {
        pl: "Od poniedziałku do piątku organizujemy prywatne wyjazdy na kopalnię piasku (minimum 2 osoby i 2 godziny jazdy). Dostępne także vouchery podarunkowe @motocross.wro! Płatność gotówką lub BLIK.",
        uk: "З понеділка по п'ятницю проводимо приватні виїзди на піщаний кар'єр (мінімум 2 учасники та 2 години катання). Також є подарункові ваучери! Оплата готівкою або BLIK.",
        ru: "С понедельника по пятницу проводим частные выезды на песчаный карьер (минимум 2 участника и 2 часа катания). Есть подарочные ваучеры! Оплата наличными или BLIK.",
      },
    },
    gallery,
  };
  if (!opts.keepAdmin || !one(db, "SELECT key FROM site_settings WHERE key='session_secret'")) {
    settings.session_secret = randomBytes(32).toString("hex");
  }
  for (const [k, v] of Object.entries(settings)) {
    run(db, "INSERT INTO site_settings (key, value_json, updated_at_utc) VALUES (?,?,?)", k, JSON.stringify(v), now());
  }

  if (!opts.keepAdmin) {
    const email = process.env.ADMIN_EMAIL ?? "admin@motoquad.pl";
    const pw = process.env.ADMIN_PASSWORD ?? "MotoQuad2026!";
    run(db, "INSERT INTO admin_users (email, password_hash, password_is_default, updated_at) VALUES (?,?,?,?)",
      email, hashPassword(pw), process.env.ADMIN_PASSWORD ? 0 : 1, now());
  }
}
