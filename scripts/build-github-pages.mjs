import { execSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const asideRoot = path.join(root, ".pages-build-aside");
const localAppRoot = path.join(root, "src/local-app");

/** Server-only paths that cannot be statically exported. */
const pathsToExclude = [
  "src/middleware.ts",
  "src/app/api",
  "src/app/tma",
  "src/app/(app)",
  "src/app/(auth)",
  "src/app/auth",
  "src/app/invite",
  "src/app/q",
  "src/app/health",
  "src/app/page.tsx",
];

function moveAside(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) return null;

  const asidePath = path.join(asideRoot, relativePath);
  mkdirSync(path.dirname(asidePath), { recursive: true });
  cpSync(absolutePath, asidePath, { recursive: true });
  rmSync(absolutePath, { recursive: true, force: true });
  return { absolutePath, asidePath };
}

function restore(entry) {
  if (!entry) return;
  mkdirSync(path.dirname(entry.absolutePath), { recursive: true });
  cpSync(entry.asidePath, entry.absolutePath, { recursive: true });
}

function copyLocalApp() {
  if (!existsSync(localAppRoot)) {
    throw new Error("Missing src/local-app for GitHub Pages build");
  }

  cpSync(path.join(localAppRoot, "page.tsx"), path.join(root, "src/app/page.tsx"));
  cpSync(
    path.join(localAppRoot, "(app)"),
    path.join(root, "src/app/(app)"),
    { recursive: true },
  );
}

function prepareOutput() {
  const outDir = path.join(root, "out");
  if (!existsSync(outDir)) {
    throw new Error("Expected Next.js static export in ./out");
  }

  writeFileSync(path.join(outDir, ".nojekyll"), "");

  const indexHtml = path.join(outDir, "index.html");
  if (!existsSync(indexHtml)) {
    throw new Error("Could not locate exported index.html for GitHub Pages");
  }

  writeFileSync(path.join(outDir, "404.html"), readFileSync(indexHtml, "utf8"));
}

function main() {
  rmSync(asideRoot, { recursive: true, force: true });

  const moved = pathsToExclude.map(moveAside);

  try {
    copyLocalApp();
    execSync("pnpm exec next build", {
      cwd: root,
      stdio: "inherit",
      env: {
        ...process.env,
        GITHUB_PAGES: "true",
        NEXT_PUBLIC_GITHUB_PAGES: "true",
      },
    });
    prepareOutput();
  } finally {
    rmSync(path.join(root, "src/app/(app)"), { recursive: true, force: true });
    rmSync(path.join(root, "src/app/page.tsx"), { force: true });
    for (const entry of moved) restore(entry);
    rmSync(asideRoot, { recursive: true, force: true });
  }
}

main();
