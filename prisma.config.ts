// DATABASE_URL is read from the datasource block in schema.prisma at runtime.
// Removing it here prevents prisma generate from failing during CI/build when
// DATABASE_URL is not yet injected (env vars are only available at Next.js
// build time, after the install phase).
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
});
