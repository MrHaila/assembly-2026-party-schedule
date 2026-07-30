/**
 * A secondary "about this site" band at the bottom of the page.
 *
 * Deliberately small and muted: it carries the attribution / open-source
 * notice without competing with the schedule content. No props, no
 * className passthrough — the layout is fixed.
 */
import { GITHUB_REPO_URL } from "@/lib/site.config";

export function SiteFooter() {
  return (
    <div className="border-t border-rule bg-paper px-3 py-4 text-[11px] leading-relaxed text-ink-mid">
      <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em]">
        About this site
      </h2>
      <p>
        Made by{" "}
        <a
          href="https://haila.fi"
          className="text-ink hover:text-ink/80 active:text-ink/60 underline underline-offset-2 transition-colors"
        >
          MrHaila
        </a>{" "}
        as an entry to Assembly Summer 2026 Fix It compo.{" "}
        <a
          href={GITHUB_REPO_URL}
          className="text-ink hover:text-ink/80 active:text-ink/60 underline underline-offset-2 transition-colors"
        >
          Open source
        </a>{" "}
        under MIT license.
      </p>
      <p className="mt-1">
        Data sourced from{" "}
        <a
          href="https://assembly.org"
          className="text-ink hover:text-ink/80 active:text-ink/60 underline underline-offset-2 transition-colors"
        >
          assembly.org
        </a>{" "}
        open GraphQL API. Feel free to fork and update for future events!
      </p>
    </div>
  );
}
