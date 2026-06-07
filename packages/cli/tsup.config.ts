import { defineConfig } from "tsup";
import { cp } from "node:fs/promises";
import path from "node:path";

/**
 * Bundle the CLI into a single self-contained file. @stackai/core (a workspace
 * package) is bundled inline so the published `stackai` package has no
 * workspace dependencies. React/ink/openai stay external — npm installs them
 * for the user from the `dependencies` field.
 */
export default defineConfig({
  entry: ["src/cli.tsx"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  bundle: true,
  clean: true,
  dts: false,
  external: ["react", "ink", "ink-spinner", "ink-text-input", "openai"],
  banner: { js: "#!/usr/bin/env node" },
  outDir: "dist",
  // Copy the built-in skills (packages/skills) next to the bundle so the
  // published package ships them. The CLI resolves them at dist/skills.
  async onSuccess() {
    await cp(path.resolve("../skills"), path.resolve("dist/skills"), {
      recursive: true,
    });
  },
});
