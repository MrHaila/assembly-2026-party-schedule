import type { ReactNode } from "react";

interface ExternalLinkProps {
  href: string;
  children: ReactNode;
}

/**
 * External link with the universal "open in new window" arrow.
 * All footer / attribution links share this geometry so the ext-link
 * affordance is consistent and never drifts.
 */
export function ExternalLink({ href, children }: ExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 text-ink underline underline-offset-2 transition-colors hover:text-ink/80 active:text-ink/60"
    >
      {children}
      <span aria-hidden className="text-[10px] leading-none">
        ↗
      </span>
    </a>
  );
}
