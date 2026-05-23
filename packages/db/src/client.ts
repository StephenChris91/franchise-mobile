import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Fallback URL lets the module initialize at build time; real queries still require DATABASE_URL at runtime.
const sql = neon(process.env.DATABASE_URL ?? "postgresql://build:build@localhost/build");

export const db = drizzle(sql, { schema });
