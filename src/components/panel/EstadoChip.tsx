import { estadoVisible, NOMBRE_ESTADO } from "@/lib/panel/reglas";
import type { Estado } from "@/lib/panel/tipos";
import styles from "./panel.module.css";

export function EstadoChip({ estado, publicadoEn, ahora }: { estado: Estado; publicadoEn: string | null; ahora?: Date }) {
  const visible = estadoVisible(estado, publicadoEn, ahora);
  return <span className={`${styles.chip} ${styles[`chip_${visible}`]}`}>{NOMBRE_ESTADO[visible]}</span>;
}
