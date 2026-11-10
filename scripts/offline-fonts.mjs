#!/usr/bin/env node
/**
 * For networks that block fonts.googleapis.com (Vercel builds don't need this).
 *
 *   npm run build:offline   → next build
 *   npm run dev:offline     → next dev
 *
 * Downloads the same font files from Fontsource on jsDelivr into .fonts-cache/,
 * serves them from a throwaway localhost server, points next/font's
 * NEXT_FONT_GOOGLE_MOCKED_RESPONSES hook at them, then runs Next.
 * Keep FONTS in sync with the next/font/google calls in src/app/layout.tsx.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const { getFontAxes } = require("next/dist/compiled/@next/font/dist/google/get-font-axes");
const { getGoogleFontsUrl } = require("next/dist/compiled/@next/font/dist/google/get-google-fonts-url");

const CDN = "https://cdn.jsdelivr.net/npm";
const FONTS = [
  {
    family: "Outfit",
    weights: ["variable"],
    styles: ["normal"],
    file: "@fontsource-variable/outfit@5/files/outfit-latin-wght-normal.woff2",
    weight: "100 900",
    style: "normal",
  },
  {
    family: "Instrument Serif",
    weights: ["400"],
    styles: ["italic"],
    file: "@fontsource/instrument-serif@5/files/instrument-serif-latin-400-italic.woff2",
    weight: "400",
    style: "italic",
  },
  {
    family: "JetBrains Mono",
    weights: ["400"],
    styles: ["normal"],
    file: "@fontsource/jetbrains-mono@5/files/jetbrains-mono-latin-400-normal.woff2",
    weight: "400",
    style: "normal",
  },
];

const root = process.cwd();
const cacheDir = path.join(root, ".fonts-cache");
mkdirSync(cacheDir, { recursive: true });

// Turbopack fetches font files over HTTP, so serve the cache on localhost.
const server = createServer((req, res) => {
  const name = path.basename(decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname));
  const file = path.join(cacheDir, name);
  if (!name.endsWith(".woff2") || !existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "content-type": "font/woff2" }).end(readFileSync(file));
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();

const mock = {};
for (const font of FONTS) {
  const local = path.join(cacheDir, path.basename(font.file));
  if (!existsSync(local)) {
    const res = await fetch(`${CDN}/${font.file}`);
    if (!res.ok) throw new Error(`Could not download ${font.file}: ${res.status}`);
    writeFileSync(local, Buffer.from(await res.arrayBuffer()));
    console.log(`[fonts] downloaded ${path.basename(local)}`);
  }
  const url = getGoogleFontsUrl(font.family, getFontAxes(font.family, font.weights, font.styles), "swap");
  mock[url] = [
    "/* latin */",
    "@font-face {",
    `  font-family: '${font.family}';`,
    `  font-style: ${font.style};`,
    `  font-weight: ${font.weight};`,
    "  font-display: swap;",
    `  src: url(http://127.0.0.1:${port}/${path.basename(local)}) format('woff2');`,
    "}",
    "",
  ].join("\n");
}

const mockFile = path.join(cacheDir, "google-fonts-mock.json");
writeFileSync(mockFile, JSON.stringify(mock, null, 2));

const command = process.argv[2] ?? "build";
const nextBin = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, command, ...process.argv.slice(3)], {
  stdio: "inherit",
  env: { ...process.env, NEXT_FONT_GOOGLE_MOCKED_RESPONSES: mockFile },
});
child.on("exit", (code) => {
  server.close();
  process.exit(code ?? 1);
});
