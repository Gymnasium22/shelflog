import type { MetadataRoute } from "next";

import { basePath } from "@/shared/config/hosting";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  const root = basePath || "";

  return {
    name: "ShelfLog",
    short_name: "ShelfLog",
    description:
      "Цифровой паспорт дома: вещи, места, документы, гарантии и семья.",
    start_url: `${root}/app/`,
    scope: `${root}/`,
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#07080d",
    theme_color: "#07080d",
    lang: "ru",
    categories: ["productivity", "utilities"],
    icons: [
      {
        src: `${root}/icons/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${root}/icons/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${root}/icons/maskable-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
