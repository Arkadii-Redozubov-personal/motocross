import type { DatabaseSync } from "node:sqlite";
import { one, run } from "../db/client";
import { getSetting } from "./settings";
import { listBookings } from "./bookings";

/** Sends an e-mail about a new booking to the owner. Failure is recorded, never thrown to the visitor. */
export async function notifyOwnerNewBooking(db: DatabaseSync, bookingId: number): Promise<"SENT" | "FAILED" | "NOT_CONFIGURED"> {
  const to = process.env.OWNER_EMAIL || getSetting(db, "contact").ownerEmail;
  const host = process.env.SMTP_HOST;
  const b = listBookings(db).find((x) => x.id === bookingId);
  if (!b) return "FAILED";
  const set = (status: string, err: string | null) =>
    run(db, "UPDATE bookings SET notification_status = ?, notification_error = ? WHERE id = ?", status, err, bookingId);

  if (!to || !host) {
    set("NOT_CONFIGURED", !to ? "Owner e-mail is not set" : "SMTP_HOST is not set");
    console.warn(JSON.stringify({ event: "notify.skipped", ref: b.referenceCode }));
    return "NOT_CONFIGURED";
  }
  try {
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" } : undefined,
    });
    const items = b.items.map((i) => `${i.qty} x ${i.title}`).join(", ");
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "no-reply@localhost",
      to,
      subject: `Nowa rezerwacja ${b.referenceCode}: ${b.date} ${b.startTime}`,
      text: [
        `Nowe zgłoszenie ${b.referenceCode} (status: NEW)`,
        `Miasto: ${b.city}`,
        `Termin: ${b.date} ${b.startTime}-${b.endTime} (Europe/Warsaw)`,
        `Sprzęt: ${items}`,
        `Kwota orientacyjna: ${b.total} PLN`,
        `Klient: ${b.customerName}, ${b.customerPhone}${b.customerEmail ? ", " + b.customerEmail : ""}`,
        b.comment ? `Komentarz: ${b.comment}` : "",
      ].filter(Boolean).join("\n"),
    });
    set("SENT", null);
    return "SENT";
  } catch (e) {
    set("FAILED", String((e as Error).message).slice(0, 300));
    console.error(JSON.stringify({ event: "notify.failed", ref: b.referenceCode }));
    return "FAILED";
  }
}

export function notificationState(db: DatabaseSync, id: number) {
  return one<{ notification_status: string; notification_error: string | null }>(db, "SELECT notification_status, notification_error FROM bookings WHERE id = ?", id);
}
