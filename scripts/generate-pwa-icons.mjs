import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const outDir = path.join(process.cwd(), "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

function svgFor(size, fullBleed = false) {
  const radius = fullBleed ? 0 : Math.round(size * 0.2);
  const font = Math.round(size * 0.28);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="100%" height="100%" rx="${radius}" fill="#171717"/>
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
        font-family="system-ui,Segoe UI,sans-serif" font-size="${font}" font-weight="700" fill="#fafafa">SL</text>
    </svg>`,
  );
}

const sizes = [180, 192, 512];
for (const size of sizes) {
  await sharp(svgFor(size))
    .png()
    .toFile(path.join(outDir, `icon-${size}.png`));
}

await sharp(svgFor(512, true))
  .png()
  .toFile(path.join(outDir, "maskable-512.png"));

console.log("PWA icons written to public/icons");
