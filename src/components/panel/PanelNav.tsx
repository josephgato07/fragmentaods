"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Rol } from "@/lib/panel/tipos";
import styles from "./panel.module.css";

const ENLACES: Array<{ href: string; texto: string; roles: Rol[] }> = [
  { href: "/panel", texto: "Inicio", roles: ["administrador", "editor", "redactor"] },
  { href: "/panel/notas", texto: "Noticias", roles: ["administrador", "editor", "redactor"] },
  { href: "/panel/fragmentos", texto: "Fragmentos", roles: ["administrador", "editor", "redactor"] },
  { href: "/panel/destacados", texto: "Destacados", roles: ["administrador", "editor"] },
  { href: "/panel/portada", texto: "Portada", roles: ["administrador", "editor"] },
  { href: "/panel/categorias", texto: "Categorías", roles: ["administrador"] },
  { href: "/panel/usuarios", texto: "Usuarios", roles: ["administrador"] },
];

export function PanelNav({ rol }: { rol: Rol }) {
  const ruta = usePathname();
  return (
    <nav className={styles.nav} aria-label="Secciones del panel">
      <ul className={`contenedor ${styles.navLista}`}>
        {ENLACES.filter((e) => e.roles.includes(rol)).map((e) => {
          const actual = e.href === "/panel" ? ruta === "/panel" : ruta === e.href || ruta.startsWith(`${e.href}/`);
          return (
            <li key={e.href}>
              <Link href={e.href} className={styles.navLink} aria-current={actual ? "page" : undefined}>
                {e.texto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
