# TanStack Start App

English | [简体中文](./README.zh-CN.md)

A starter built with TanStack Start, React, TypeScript, TanStack Query, and Tailwind CSS. Vite and Nitro handle development and production builds. Includes a counter, streaming SSR and route-loading examples, theme management, and default loading/error pages.

## Quick start

Use Node.js **22.23.2** and pnpm **10.24.0**, as specified in [package.json](./package.json). The Node version is also recorded in `.nvmrc`.

```sh
pnpm install
pnpm dev
```

Open <http://localhost:3000>. To build and preview locally:

```sh
pnpm build
pnpm preview
```

Development and preview both default to port `3000`, configured in [vite.config.ts](./vite.config.ts). Stop the development server before previewing on that port. Production build output is written to `.output/`.

## Commands

| Command                           | Purpose                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------- |
| `pnpm dev`                        | Start the development server                                                  |
| `pnpm build`                      | Build the client and SSR server                                               |
| `pnpm preview`                    | Preview an existing production build locally                                  |
| `pnpm lint` / `pnpm lint:fix`     | Check ESLint rules / apply available fixes                                    |
| `pnpm format` / `pnpm format:fix` | Check formatting / format files with Prettier                                 |
| `pnpm typecheck`                  | Check types using `tsc -p tsconfig.json`                                      |
| `pnpm test`                       | Run Vitest tests                                                              |
| `pnpm check`                      | Run lint, formatting, type checking, and tests in order                       |
| `pnpm check:fix`                  | Run ESLint fixes and Prettier formatting; does not run type checking or tests |

## Example pages

| Route        | Behavior                                                                                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`          | Counter with increment, decrement, and reset controls; starts at zero on each mount and is not persisted                                                    |
| `/streaming` | Returns unresolved promises from the loader; independent `Await` boundaries reveal overview data after about 1.2 seconds and activity after about 3 seconds |
| `/pending`   | Awaits a simulated 2-second task before rendering; uses the router's default `RouterPending` component                                                      |

To observe **SSR streaming**, directly open or fully refresh `/streaming`: the shell and placeholders arrive before the deferred content. Client-side navigation to that page instead demonstrates progressive loading in the browser.

To observe **route Pending**, click the `/pending` link on the home page. After about 150ms, `RouterPending` appears and stays visible for at least 300ms once shown. The destination page renders when its task completes. Return home and enter again to repeat; this route uses `gcTime: 0` to avoid retaining its inactive loader data. A direct visit or refresh exercises SSR rather than this client-navigation sequence.

Both home-page example links disable preloading so hovering does not start their tasks early. Both examples use local simulated data and Router loader data, not the Query cache.

## Routing and data

- [src/router.tsx](./src/router.tsx) creates the router, sets defaults for loading, not-found and error components, and integrates TanStack Query with SSR.
- [src/context.ts](./src/context.ts) creates one `QueryClient` per router. SSR requests get separate instances; browser navigation reuses the client attached to its router. The default Query `staleTime` is 30 seconds, which defines freshness rather than a polling interval.
- Router coordinates navigation and loader execution. Query can own business-data fetching, caching, and invalidation. Share `queryOptions()` between a loader and its component when introducing Query-backed pages.
- `defaultPreloadStaleTime: 0` lets Query decide whether a preload needs fresh data. `setupRouterSsrQueryIntegration` provides the Query provider and handles dehydration, hydration, and streaming; a second QueryClient or provider is not needed.

File routes live in `src/routes`. Vite development and build runs generate `src/routeTree.gen.ts`; do not edit it manually. After adding or removing routes, run development or build before checking types, and commit the updated route tree with the route changes. CI runs `pnpm check` before `pnpm build`, using the committed route tree for type checking and tests.

Application code, tests, and Vite/Vitest configuration files share [tsconfig.json](./tsconfig.json). The `@/*` alias maps to `src/*` and is resolved by both Vite and Vitest.

## Theme and styles

The [root document](./src/routes/__root.tsx) uses `ThemeProvider` and `getThemeScript()` from `@ringotangs/react-theme`. Both use the package defaults: `system` mode, localStorage key `theme`, and the `dark` class on `<html>`.

The synchronous head script applies the initial color scheme before the body is parsed. The Provider restores the saved preference after hydration. `<html suppressHydrationWarning>` accommodates the script's intentional class and style changes before hydration; it does not disable checks for the whole component tree. No Vite theme plugin is needed for this SSR document.

Import `useTheme` and theme types directly from `@ringotangs/react-theme` in components. A preference is saved when the user changes it; mounting does not write a default value or replace an invalid stored value.

Tailwind CSS loads through `src/styles/index.css`, with theme variables in `src/styles/theme.css`. The `dark:` variant follows the root `dark` class.

## Tests

Vitest uses [vitest.config.ts](./vitest.config.ts), separately from the application configuration. Tests run in Node by default and follow standard naming conventions such as `*.spec.ts`, `*.test.ts`, and their `.tsx`, `.js`, and `.jsx` equivalents. File names alone do not select the environment.

Keep tests beside the code they cover, such as [src/components/Button.spec.tsx](./src/components/Button.spec.tsx). Router behavior tests live in [src/router.spec.tsx](./src/router.spec.tsx), outside `src/routes` so they are not discovered as pages. Third-party package internals are not retested here.

For React component and DOM tests, add this comment at the top of the file:

```ts
// @vitest-environment jsdom
```

jsdom simulates browser APIs in Node; these are not real-browser tests. Vitest loads `src/setup.dom.ts` before each file to provide DOM matchers. No manual setup import is needed, and loading the setup file alone does not create `window` or `document`.

Automatic component cleanup is not configured. Explicitly call `cleanup()` from React Testing Library between tests that mount components, for example with `afterEach(cleanup)`. Import test functions from `vitest`; use React Testing Library and awaited `userEvent` interactions for user behavior, or controlled events and fake timers for precise timing checks. Create independent Router or Query instances when needed.

Run a specific file with:

```sh
pnpm test src/components/Button.spec.tsx
```

Pure functions and server business logic can be tested in Node, and component SSR output can be tested with React's server-rendering APIs. Validating Nitro/Start request context, Server Function communication, or actual streaming requires integration checks against the full application. The Vitest configuration does not load the Nitro or TanStack Start application plugins.

## License

[MIT](./LICENSE)
