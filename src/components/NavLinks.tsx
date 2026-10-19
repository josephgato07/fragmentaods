"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Section } from "@/lib/content";
import { paths } from "@/lib/format";
import styles from "./NavLinks.module.css";

type Variant = "bar" | "chips" | "menu";

export function NavLinks({ sections, variant }: { sections: Section[]; variant: Variant }) {
  const pathname = usePathname();
  const items = [
    ...sections.map((s) => ({ href: paths.section(s.slug), label: s.name })),
    { href: paths.fragments(), label: "Fragmentos" },
  ];

  return (
    <ul className={styles[variant]}>
      {items.map((item) => {
        const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link href={item.href} className={styles.link} aria-current={current ? "page" : undefined}>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
