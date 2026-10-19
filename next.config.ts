import type { NextConfig } from "next";

/** Permite optimizar las imágenes públicas del bucket editorial de Supabase. */
function supabaseImagePattern() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return [];
  try {
    const url = new URL(raw);
    return [
      {
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        port: url.port,
        pathname: "/storage/v1/object/public/imagenes-editoriales/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  images: {
    // Tamaños pensados para fotos editoriales a ancho completo y en columnas.
    deviceSizes: [400, 640, 828, 1080, 1280, 1600],
    imageSizes: [96, 160, 256, 384],
    remotePatterns: supabaseImagePattern(),
    // Solo para pruebas con Supabase local (127.0.0.1). En producción queda desactivado.
    dangerouslyAllowLocalIP: process.env.IMAGENES_SUPABASE_LOCAL === "1",
  },
};

export default nextConfig;
