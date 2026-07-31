import type { ReactNode } from "react";

export type ActionTone = "solid" | "outline" | "gold";

/** One geometry for every action control so heights can never drift. */
const BASE =
  "inline-flex shrink-0 items-center justify-center gap-1.5 border px-2.5 py-1 text-[12px] font-bold uppercase leading-none tracking-[0.05em]";

const TONES: Record<ActionTone, string> = {
  solid:
    "border-strong bg-ink text-paper transition-colors duration-100 hover:border-spot hover:bg-spot active:border-ink-mid active:bg-ink-mid",
  outline: "press border-strong",
  gold: "press-gold border-gold",
};

interface CommonProps {
  tone?: ActionTone;
  children: ReactNode;
  /** Marks the gold tone as "set" (drives the [data-favourite] contract). */
  active?: boolean;
  label?: string;
}

interface ActionButtonProps extends CommonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  pressed?: boolean;
}

export function ActionButton({
  tone = "outline",
  children,
  onClick,
  active,
  label,
  pressed,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      data-favourite={active ? "" : undefined}
      className={`${BASE} ${TONES[tone]}`}
    >
      {children}
    </button>
  );
}

interface ActionLinkProps extends CommonProps {
  href: string;
}

export function ActionLink({
  tone = "outline",
  children,
  href,
  label,
}: ActionLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className={`${BASE} ${TONES[tone]}`}
    >
      {children}
    </a>
  );
}
