import Link from "next/link";
import type { Inline } from "@/lib/content";

/**
 * Renderiza texto con énfasis (subrayado negro fino) y enlaces (subrayado menta grueso).
 * El énfasis no es un enlace: se usa solo para la frase central, nunca para párrafos enteros.
 */
export function RichText({ content }: { content: Inline[] }) {
  return (
    <>
      {content.map((part, i) => {
        if (typeof part === "string") return part;
        if (part.type === "enfasis") {
          return (
            <span key={i} className="enfasis">
              {part.text}
            </span>
          );
        }
        const external = /^https?:\/\//.test(part.href);
        return external ? (
          <a key={i} href={part.href} className="enlace" target="_blank" rel="noopener noreferrer">
            {part.text}
          </a>
        ) : (
          <Link key={i} href={part.href} className="enlace">
            {part.text}
          </Link>
        );
      })}
    </>
  );
}
