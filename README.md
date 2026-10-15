# TanStack Start App

## Tests

Vitest runs two test projects using a configuration separate from the application:

- `client`: React component and DOM tests named `*.client.spec.tsx` or `*.client.test.tsx`. These tests use jsdom to simulate the client environment, the React plugin, DOM matchers, and automatic cleanup from `src/test/setup.client.ts`. They do not run in a real browser.
- `server`: Node unit tests named `*.server.spec.ts` or `*.server.test.ts`. These tests run without browser globals or client setup. Pure function tests can use this project too.

Both naming conventions support `.ts`, `.tsx`, `.js`, and `.jsx`. Test files must explicitly include `.client` or `.server` before `.spec` or `.test`; ordinary `*.spec.ts` and `*.test.ts` files without that marker are not collected.

Import test functions explicitly from `vitest`. Use React Testing Library to render components and `userEvent.setup()` with awaited interactions to test user behavior. Add Router or Query providers when a component requires them, creating independent instances for each test.

```sh
pnpm test
pnpm test --project client
pnpm test --project server
pnpm check
```

`pnpm test` runs both projects and fails if either has failing tests. `pnpm check` runs lint, formatting, type checking, and tests.

Test server business logic as ordinary functions in the server project. SSR, Server Function communication, and request context need integration tests against a running application. Unit tests do not load the Nitro or TanStack Start application plugins. Application and test TypeScript files share `tsconfig.app.json`.
