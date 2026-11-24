import type { DatabaseSync } from "node:sqlite";
import { run } from "../db/client";

export function writeAudit(db: DatabaseSync, adminEmail: string, action: string, entityType: string, entityId?: string, details?: unknown) {
  run(db, "INSERT INTO audit_logs (admin_email, action, entity_type, entity_id, details_json, created_at_utc) VALUES (?,?,?,?,?,?)",
    adminEmail, action, entityType, entityId ?? null, details ? JSON.stringify(details) : null, new Date().toISOString());
}

