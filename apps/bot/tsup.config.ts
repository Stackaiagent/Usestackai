import { defineConfig } from "tsup";
import { cp } from "node:fs/promises";
import path from "node:path";

/**
 * Bundle the Telegram bot. @stackai/core is inlined; grammy + supabase stay
 * external (installed from dependencies). The built-in skills (packages/skills)
 * are copied next to the bundle so the bot can run them server-side.
 */
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  bundle: true,
  clean: true,
  dts: false,
  external: ["grammy", "@supabase/supabase-js"],
  outDir: "dist",
  async onSuccess() {
    await cp(
      path.resolve("../../packages/skills"),
      path.resolve("dist/skills"),
      { recursive: true },
    );
  },
});
