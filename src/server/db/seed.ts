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
    slug: "segway-at5l",
    category: "quad",
    title: ["Segway Snarler AT5L", "Segway Snarler AT5L", "Segway Snarler AT5L"],
    desc: [
      "Dwuosobowy quad ze wspomaganiem kierownicy EPS. Jedziesz sam albo z pasażerem.",
      "Двомісний квадроцикл з підсилювачем керма EPS. Їдеш сам або з пасажиром.",
      "Двухместный квадроцикл с усилителем руля EPS. Едете сами или с пассажиром.",
    ],
    specs: [
      "Wspomaganie kierownicy EPS|2 miejsca|Wyciągarka z przodu|Napęd 4x4",
      "Підсилювач керма EPS|2 місця|Лебідка спереду|Привід 4x4",
      "Усилитель руля EPS|2 места|Лебёдка спереди|Привод 4x4",
    ],
    beginner: false,
    image: "/media/ig/fleet-pinned-cover.jpg",
    hourly: 250,
    assets: ["QUAD-SEG-01", "QUAD-SEG-02", "QUAD-SEG-03"],
  },
  {
    slug: "tgb-4x4",
    category: "quad",
    title: ["Quad terenowy TGB 4x4", "Квадроцикл TGB 4x4", "Квадроцикл TGB 4x4"],
    desc: [
      "Terenowy quad do jazdy po błocie, piachu i leśnych drogach.",
      "Позашляховий квадроцикл для бруду, піску та лісових доріг.",
      "Внедорожный квадроцикл для грязи, песка и лесных дорог.",
    ],
    specs: [
      "Napęd 4x4|Listwa LED|Opony terenowe|Kufer bagażowy",
      "Привід 4x4|LED-балка|Позашляхові шини|Багажний кофр",
      "Привод 4x4|LED-балка|Внедорожные шины|Багажный кофр",
    ],
    beginner: false,
    image: "/media/client/quads-terrain.jpg",
    hourly: 250,
    assets: ["QUAD-TGB-01"],
  },
  {
    slug: "enduro-250",
    category: "moto",
    title: ["Motocykl enduro 250 cm³ Economy", "Мотоцикл ендуро 250 см³ Економ", "Мотоцикл эндуро 250 см³ Эконом"],
    desc: [
      "Lekki motocykl enduro na polne drogi, las i kopalnię piasku.",
      "Легкий мотоцикл ендуро для польових доріг, лісу та піщаного кар'єру.",
      "Лёгкий мотоцикл эндуро для полевых дорог, леса и песчаного карьера.",
    ],
    specs: ["250 cm³|Lekka rama|Opony terenowe", "250 см³|Легка рама|Позашляхові шини", "250 см³|Лёгкая рама|Внедорожные шины"],
    beginner: false,
    image: "/media/ig/asix-88-profile.jpg",
    hourly: 150,
    assets: ["MOTO-250-01", "MOTO-250-02", "MOTO-250-03"],
  },
  {
    slug: "enduro-standard",
    category: "moto",
    title: ["Motocykl enduro Standard", "Мотоцикл ендуро Стандарт", "Мотоцикл эндуро Стандарт"],
    desc: [
      "Mocniejszy motocykl dla osób, które jeździły już w terenie.",
      "Потужніший мотоцикл для тих, хто вже катався бездоріжжям.",
      "Более мощный мотоцикл для тех, кто уже ездил по бездорожью.",
    ],
    specs: ["Klasa Standard|Opony terenowe|Dla jeżdżących w terenie", "Клас Стандарт|Позашляхові шини|Для досвідчених", "Класс Стандарт|Внедорожные шины|Для опытных"],
    beginner: false,
    image: "/media/ig/quarry-4-riders.jpg",
    hourly: 200,
    assets: ["MOTO-STD-01", "MOTO-STD-02", "MOTO-STD-03"],
  },
  {
    slug: "enduro-300-start",
    category: "moto",
    title: ["Motocykl enduro 300 cm³ Start", "Мотоцикл ендуро 300 см³ Старт", "Мотоцикл эндуро 300 см³ Старт"],
    desc: [
      "Nowszy motocykl 300 cm³ – wybór dla początkujących. Na placu uczysz się od zera.",
      "Новіший мотоцикл 300 см³ — вибір для початківців. На майданчику вчимо з нуля.",
      "Более новый мотоцикл 300 см³ — выбор для новичков. На площадке учим с нуля.",
    ],
    specs: ["300 cm³|Nowszy model|Nauka na placu przed trasą", "300 см³|Новіша модель|Навчання на майданчику перед трасою", "300 см³|Более новая модель|Обучение на площадке перед трассой"],
    beginner: true,
    image: "/media/ig/enduro-300-beginner.jpg",
    hourly: 250,
    assets: ["MOTO-300-01"],
  },
];

const GALLERY_SEED = [
  { src: "/media/ig/quarry-4-riders.jpg", alt: { pl: "Czterech kierowców enduro na kopalni piasku", uk: "Четверо райдерів ендуро в піщаному кар'єрі", ru: "Четверо райдеров эндуро в песчаном карьере" } },
  { src: "/media/ig/segway-trail-action.jpg", alt: { pl: "Widok z kierownicy quada Segway na leśnej ścieżce", uk: "Вигляд із керма квадроцикла Segway на лісовій стежці", ru: "Вид с руля квадроцикла Segway на лесной тропе" } },
  { src: "/media/ig/enduro-pov-forest.jpg", alt: { pl: "Jazda enduro leśnym szlakiem pod Wrocławiem", uk: "Поїздка на ендуро лісовою трасою біля Вроцлава", ru: "Поездка на эндуро по лесной трассе под Вроцлавом" } },
  { src: "/media/ig/fleet-pinned-cover.jpg", alt: { pl: "Kierowca w kasku na pomarańczowym quadzie Segway AT5L", uk: "Райдер у шоломі на помаранчевому квадроциклі Segway AT5L", ru: "Райдер в шлеме на оранжевом квадроцикле Segway AT5L" } },
  { src: "/media/ig/enduro-lineup.jpg", alt: { pl: "Motocykle ASIX Enduro przygotowane do jazdy", uk: "Мотоцикли ASIX Enduro готові до виїзду", ru: "Мотоциклы ASIX Enduro готовы к выезду" } },
  { src: "/media/ig/rider-raven-helmet.jpg", alt: { pl: "Uczestniczka jazdy w kasku Raven i rękawicach", uk: "Учасниця поїздки у шоломі Raven та рукавицях", ru: "Участница поездки в шлеме Raven и перчатках" } },
  { src: "/media/ig/quad-forest-ride.jpg", alt: { pl: "Ślady opon na piaszczystym poligonie", uk: "Сліди шин на піщаному полігоні", ru: "Следы шин на песчаном полигоне" } },
  { src: "/media/client/quads-terrain.jpg", alt: { pl: "Dwa quady terenowe na błotnistym placu we mgle", uk: "Два квадроцикли на брудному майданчику в тумані", ru: "Два квадроцикла на грязной площадке в тумане" } },
  { src: "/media/ig/forest-river-tour.jpg", alt: { pl: "Leśna rzeka na trasie wyprawowej pod Świdnicą", uk: "Лісова річка на маршруті під Свідницею", ru: "Лесная речка на маршруте под Свидницей" } },
  { src: "/media/ig/asix-88-profile.jpg", alt: { pl: "Motocykl enduro ASIX 250 cm³ w kolorze limonkowym", uk: "Мотоцикл ендуро ASIX 250 см³ лаймового кольору", ru: "Мотоцикл эндуро ASIX 250 см³ лаймового цвета" } },
];

export function seedIfEmpty(db: DatabaseSync) {
  const has = one<{ c: number }>(db, "SELECT COUNT(*) AS c FROM locations");
  if (has && has.c > 0) {
    // Idempotent media upgrade if the DB was first seeded before IG photos were downloaded.
    const seg = one<{ image_url: string }>(db, "SELECT image_url FROM vehicle_models WHERE slug = 'segway-at5l'");
    const galRow = one<{ value_json: string }>(db, "SELECT value_json FROM site_settings WHERE key = 'gallery'");
    const galLen = galRow ? (JSON.parse(galRow.value_json) as unknown[]).length : 0;
    if (seg?.image_url === "/media/client/quads-terrain.jpg" && galLen <= 2) {
      for (const m of MODELS) {
        if (pub(m.image)) run(db, "UPDATE vehicle_models SET image_url = ? WHERE slug = ?", m.image, m.slug);
      }
      const nextGallery = GALLERY_SEED.filter((x) => pub(x.src)).map((x, i) => ({ id: `g${i + 1}`, visible: true, ...x }));
      run(db, "UPDATE site_settings SET value_json = ?, updated_at_utc = ? WHERE key = 'gallery'", JSON.stringify(nextGallery), now());
    }
    return;
  }

  db.exec("BEGIN");
  try {
    // Locations: Wroclaw on weekdays (+Sunday), Poznan on Saturdays — per client call.
    run(db, `INSERT INTO locations (slug, city_pl, city_uk, city_ru, address_pl, address_uk, address_ru) VALUES (?,?,?,?,?,?,?)`,
      "wroclaw", "Wrocław", "Вроцлав", "Вроцлав",
      "Dokładny adres i dojazd wyślemy po potwierdzeniu rezerwacji.",
      "Точну адресу та схему проїзду надішлемо після підтвердження бронювання.",
      "Точный адрес и схему проезда отправим после подтверждения брони.");
    run(db, `INSERT INTO locations (slug, city_pl, city_uk, city_ru, address_pl, address_uk, address_ru) VALUES (?,?,?,?,?,?,?)`,
      "poznan", "Poznań", "Познань", "Познань",
      "Dokładny adres i dojazd wyślemy po potwierdzeniu rezerwacji.",
      "Точну адресу та схему проїзду надішлемо після підтвердження бронювання.",
      "Точный адрес и схему проезда отправим после подтверждения брони.");
    const wro = one<{ id: number }>(db, "SELECT id FROM locations WHERE slug='wroclaw'")!.id;
    const poz = one<{ id: number }>(db, "SELECT id FROM locations WHERE slug='poznan'")!.id;
    for (let wd = 0; wd <= 6; wd++) {
      run(db, "INSERT INTO schedules (location_id, weekday, is_open, open_time, close_time) VALUES (?,?,?,?,?)", wro, wd, wd === 6 ? 0 : 1, "09:00", "18:00");
      run(db, "INSERT INTO schedules (location_id, weekday, is_open, open_time, close_time) VALUES (?,?,?,?,?)", poz, wd, wd === 6 ? 1 : 0, "09:00", "18:00");
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
    addon("instructor", ["Instruktor jadący obok", "Інструктор їде поруч", "Инструктор едет рядом"], "per_hour", 100);
    addon("gopro", ["Kamera GoPro", "Камера GoPro", "Камера GoPro"], "flat", 30);
    addon("drone", ["Nagranie z drona", "Зйомка на дрон", "Съёмка на дрон"], "per_hour", 100);

    const gallery = GALLERY_SEED.filter((x) => pub(x.src)).map((x, i) => ({ id: `g${i + 1}`, visible: true, ...x }));

    const settings: Record<string, unknown> = {
      contact: {
        phone: "+48 729 497 816",
        email: "",
        ownerEmail: "",
        instagramUrl: "https://www.instagram.com/cross_wroclaw/",
        facebookUrl: "",
      },
      booking: { slotStepMin: 60, minLeadMin: 60, horizonDays: 90 },
      texts: { heroTitle: { pl: "", uk: "", ru: "" }, heroSubtitle: { pl: "", uk: "", ru: "" } },
      promo: {
        enabled: true,
        title: {
          pl: "Grupy, wieczory kawalerskie i vouchery",
          uk: "Групи, парубоцькі вечори та сертифікати",
          ru: "Группы, мальчишники и сертификаты",
        },
        body: {
          pl: "Jazda prywatna poza grafikiem od 3 maszyn na 2 godziny lub 2 maszyn na 3 godziny. Wybierasz miejsce i godzinę. Vouchery prezentowe (druk lub PDF) ważne 3 lata.",
          uk: "Приватна їзда поза графіком від 3 машин на 2 години або 2 машин на 3 години. Ви обираєте місце та час. Подарункові сертифікати (друк або PDF) діють 3 роки.",
          ru: "Частная поездка вне графика от 3 машин на 2 часа или 2 машин на 3 часа. Вы выбираете место и время. Подарочные сертификаты (печать или PDF) действуют 3 года.",
        },
      },
      gallery,
      session_secret: randomBytes(32).toString("hex"),
    };
    for (const [k, v] of Object.entries(settings)) {
      run(db, "INSERT INTO site_settings (key, value_json, updated_at_utc) VALUES (?,?,?)", k, JSON.stringify(v), now());
    }

    const email = process.env.ADMIN_EMAIL ?? "admin@motoquad.pl";
    const pw = process.env.ADMIN_PASSWORD ?? "MotoQuad2026!";
    run(db, "INSERT INTO admin_users (email, password_hash, password_is_default, updated_at) VALUES (?,?,?,?)",
      email, hashPassword(pw), process.env.ADMIN_PASSWORD ? 0 : 1, now());
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
