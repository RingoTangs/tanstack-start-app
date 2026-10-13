# TanStack Start App

## Tests

Vitest runs two test projects using a configuration separate from the application:

- `dom`: React component and DOM tests named `*.dom.spec.tsx` or `*.dom.test.tsx`. The same naming convention supports `.ts`, `.js`, and `.jsx`. These tests use jsdom, the React plugin, DOM matchers, and automatic cleanup after each test.
- `node`: All other files matching Vitest's default test patterns, such as `*.spec.ts` and `*.test.ts`. These tests use Node without browser globals or DOM setup.

Import test functions explicitly from `vitest`. Use React Testing Library to render components and `userEvent.setup()` with awaited interactions to test user behavior. Add Router or Query providers when a component requires them, creating independent instances for each test.

```sh
pnpm test
pnpm test --project dom
pnpm test --project node
pnpm check
```

`pnpm test` runs both projects and fails if either has failing tests. `pnpm check` runs lint, formatting, type checking, and tests.

Test server business logic as ordinary functions in the Node project. SSR, Server Function communication, and request context need integration tests against a running application. Unit tests do not load the Nitro or TanStack Start application plugins.
