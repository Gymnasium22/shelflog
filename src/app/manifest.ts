import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ShelfLog",
    short_name: "ShelfLog",
    description:
      "Цифровой паспорт дома: вещи, места, документы, гарантии и семья.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    lang: "ru",
    categories: ["productivity", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
