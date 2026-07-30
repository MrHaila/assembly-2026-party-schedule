# Assembly 2026 Party Schedule 

Let's make a SPA to display Assembly Summer schedule in a better way. Attached is a rough draft of what would be a reasonable starting point. Treat this doc as a suggestion rather than a hard list of requirements. My intent is to build the project in a test driven way where automation can catch false assumptions quickly and manual smoke testing remains as a last resort. I want the code to be clearly separated in concerns with utilities and data fetching segregated to their own libraries and frontend utilizing components with strongly typed APIs. I want to develop highly optinionated components that can only be used in a very specific way to guard against style drift and inline-styles that could cause visual regressions as the project evolves.

For the visual design, I think we have to build something first and dog-food it before locking into specific design patterns. I want to make sure the project design is documented next to the source code and design changes always get updated in the docs, so style decisions do not get lost or become implicit. The final design is sure to evolve from the first PRD.

I want to first focus on data fetching and information architecture over styling. Once the presentation is in place and responsivity is sufficiently handled, I want to focus on iterating the finer points of the styling. More complicated features like favouriting should be their own efforts once the whole app is proven to work in a real setting. The minimal thing has to work first before feature creeping it.

My personal preference is anally strict TS+Vue+Vite+Vitest+OXC linter+Tailwind but I can be persuaded to other stacks that fit Lovable better.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c48fa985-3df6-4478-83f7-82bae601060a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
