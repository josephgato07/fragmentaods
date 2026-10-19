import Image from "next/image";
import type { ReactNode } from "react";
import type { ImageAsset } from "@/lib/content";
import styles from "./Photo.module.css";

type Ratio = "16/9" | "3/2" | "4/5" | "1/1" | "auto";

interface PhotoProps {
  image: ImageAsset;
  /** Proporción del recorte. "auto" respeta la imagen original. */
  ratio?: Ratio;
  /** Proporción alternativa para celular (< 600 px). */
  mobileRatio?: Ratio;
  /** Atributo `sizes` para que el navegador elija el archivo justo. */
  sizes: string;
  priority?: boolean;
  /** Elemento apoyado sobre el borde inferior (etiqueta). */
  overlay?: ReactNode;
  /** Muestra pie de foto y crédito debajo. */
  withCaption?: boolean;
  className?: string;
}

const ratioValue = (r: Ratio, image: ImageAsset) => (r === "auto" ? `${image.width}/${image.height}` : r);

export function Photo({
  image,
  ratio = "3/2",
  mobileRatio,
  sizes,
  priority = false,
  overlay,
  withCaption = false,
  className,
}: PhotoProps) {
  const style = {
    "--ratio": ratioValue(ratio, image),
    "--ratio-mobile": ratioValue(mobileRatio ?? ratio, image),
    "--focal": image.focal ?? "50% 50%",
  } as React.CSSProperties;

  const frame = (
    <div className={`${styles.frame} ${image.fit === "contain" ? styles.contain : ""}`} style={style}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        priority={priority}
        className={styles.img}
      />
      {overlay ? <div className={styles.overlay}>{overlay}</div> : null}
    </div>
  );

  if (!withCaption) return <div className={className}>{frame}</div>;

  return (
    <figure className={`${styles.figure} ${className ?? ""}`}>
      {frame}
      <figcaption className={styles.caption}>
        {image.caption ? <span>{image.caption}</span> : null}
        {image.credit ? <span className={styles.credit}>Foto: {image.credit}</span> : null}
      </figcaption>
    </figure>
  );
}
