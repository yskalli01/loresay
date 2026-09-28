import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { serverEnv } from "@/env";

const client = postgres(serverEnv.DATABASE_URL, {
  prepare: false,
});

export const db = drizzle(client);
