import "server-only";
import { getDb } from "@/server/db/client";
import { getSetting } from "@/server/services/settings";
import { getAddons, getLocations, getModels } from "@/server/services/catalog";

export function loadSite() {
  const db = getDb();
  return {
    contact: getSetting(db, "contact"),
    texts: getSetting(db, "texts"),
    promo: getSetting(db, "promo"),
    gallery: getSetting(db, "gallery").filter((g) => g.visible),
    models: getModels(db, true),
    addons: getAddons(db, true),
    locations: getLocations(db, true),
  };
}
export type Site = ReturnType<typeof loadSite>;

