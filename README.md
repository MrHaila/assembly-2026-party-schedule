# Assembly 2026 Party Schedule

The official [Assembly] org website is... fine. But I don't love the party schedule pages. It's actually really hard to know what's going on at any given moment and which ones I was planning to attend.

Here's my fix: a 90s TV programming inspired party schedule viewer.

Before:

![Website screenshot](asm-website.jpeg)

After:

![Website screenshot](after.jpeg)

Party-vibed together with Lovable for the Fix It compo.

## The Deets

Looks like the official Assembly website exposes an undocumented GraphQL API that it uses itself to poll for schedule updates. It had open CORS so this website is a SPA that simply consumes the same data. This means the schedule stays in sync during the event as things change and move around.

I chose a design with two modalities: a responsive grid view for desktop and a list view for mobile.

The desktop grid adds as many columns as fits your screen and collapses the rest into a condensed list per day. I wanted the whole event to be in one scrollable list to make it easier to understand the party as a stream of parallel happenings at various locations without any clicking in between. Highlights for ongoing events and an indicator for current time helps ground where "now" is.

Mobile view uses a flat single-column list since nothing else fits.

A favouriting feature helps curate the most interesting events and enables a "next up" banner. This is especially useful on mobile for quick lookups.

## Contributions & Feedback

PR's welcome, if unlikely. Feel free to fork/remix for future events.

## License

MIT
