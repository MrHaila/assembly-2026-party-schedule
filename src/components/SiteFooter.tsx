/**
 * A secondary "about this site" band at the bottom of the page.
 *
 * Deliberately small and muted: it carries the attribution / open-source
 * notice without competing with the schedule content. No props, no
 * className passthrough — the layout is fixed.
 */
import { ExternalLink } from "@/components/ui/ExternalLink";
import { GITHUB_REPO_URL } from "@/lib/site.config";

export function SiteFooter() {
  return (
    <div className="border-t border-rule bg-paper px-3 py-4 text-[11px] leading-relaxed text-ink-mid">
      <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em]">
        About this site
      </h2>
      <p>
        Made by{" "}
        <ExternalLink href="https://haila.fi">MrHaila</ExternalLink>{" "}
        as an entry to Assembly Summer 2026 Fix It compo.{" "}
        <ExternalLink href={GITHUB_REPO_URL}>Open source</ExternalLink>{" "}
        under MIT license.
      </p>
      <p className="mt-1">
        Data sourced from{" "}
        <ExternalLink href="https://assembly.org">assembly.org</ExternalLink>{" "}
        open GraphQL API. Feel free to fork and update for future events!
      </p>
    </div>
  );
}
