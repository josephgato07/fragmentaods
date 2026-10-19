/** Íconos de trazo simples. Todos son decorativos: el texto accesible va en el control. */
type IconProps = { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
});

export const SearchIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </svg>
);

export const MenuIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CloseIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const ArrowLeft = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

export const ArrowRight = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M9 5l7 7-7 7" />
  </svg>
);

export const LinkIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
    <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
  </svg>
);

export const ShareIcon = ({ size = 18 }: IconProps) => (
  <svg {...base(size)}>
    <path d="M12 3v12M7 8l5-5 5 5" />
    <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
  </svg>
);
