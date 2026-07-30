interface AssemblyMarkProps {
  /** Rendered size in px; the mark is square-ish and scales from viewBox. */
  size?: number;
}

/**
 * Assembly "A" mark. Ink-coloured via currentColor so it inherits the
 * surrounding text colour — no colour prop, by design (design-log #12).
 */
export function AssemblyMark({ size = 24 }: AssemblyMarkProps) {
  return (
    <svg
      viewBox="0 0 169 122"
      width={size}
      height={(size * 122) / 169}
      fill="none"
      role="img"
      aria-label="Assembly"
      className="shrink-0 text-ink"
    >
      <path
        d="M156.868 66.4795L147.12 121.764H101.91L107.119 92.2036L156.868 66.4795ZM50.0237 121.764L66.1929 98.2378L40.4077 81.2546L85.4555 70.275L119.758 20.4854L112.126 63.7728L159.372 52.2539L168.53 0.225586H83.7358L0 121.764H50.0237Z"
        fill="currentColor"
      />
    </svg>
  );
}
