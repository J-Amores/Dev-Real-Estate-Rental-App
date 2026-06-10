// @ts-check
import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

// https://astro.build/config
export default defineConfig({
  // Static output — deployable as-is on Vercel (auto-detected). See .harness/spec.md (deploy: prepare-only).
  output: "static",
  integrations: [preact()],
  vite: {
    plugins: [tailwindcss()],
    // The root postcss.config.mjs is kept temporarily for the legacy Next.js app
    // (M0 baseline capture). Neutralize it for Astro so Tailwind v4 runs only
    // through @tailwindcss/vite. Remove this override once postcss.config.mjs is
    // deleted in M1 cleanup.
    css: { postcss: { plugins: [] } },
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
  },
});
