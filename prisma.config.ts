import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

import { defineConfig } from "prisma/config";

export default defineConfig({});
