/**
 * Server-only entry point for the timeline. The route loader calls this during
 * SSR, so the fetch (and the server-held cache behind it) runs on the Worker,
 * never in the browser — the data lands in the HTML and the page paints
 * without a skeleton. The createServerFn compiler strips the handler from the
 * client bundle; on a client-side navigation this becomes an RPC to the Worker.
 */
import { createServerFn } from "@tanstack/react-start";
import { getCachedScheduleList } from "./schedule-client";

export const fetchScheduleListCached = createServerFn({ method: "GET" }).handler(
  () => getCachedScheduleList(),
);
