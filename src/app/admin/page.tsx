import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/server/db/client";
import { COOKIE, passwordIsDefault, verifySessionToken } from "@/server/services/auth";
import { getAddons, getExceptions, getLocations, getModels } from "@/server/services/catalog";
import { getSetting } from "@/server/services/settings";
import { AdminShell } from "@/features/admin/AdminShell";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const db = getDb();
  const token = (await cookies()).get(COOKIE)?.value;
  const email = verifySessionToken(db, token);
  if (!email) redirect("/admin/login");

  return (
    <AdminShell
      email={email}
      mustChange={passwordIsDefault(db, email)}
      models={getModels(db, false)}
      addons={getAddons(db, false)}
      locations={getLocations(db, false)}
      exceptions={getExceptions(db)}
      content={{
        contact: getSetting(db, "contact"),
        texts: getSetting(db, "texts"),
        promo: getSetting(db, "promo"),
        gallery: getSetting(db, "gallery"),
      }}
    />
  );
}

