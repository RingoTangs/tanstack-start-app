# TanStack Start App

## Tests

Vitest runs a single test project using a configuration separate from the application. Tests use Node by default and follow Vitest's standard naming conventions, such as `*.spec.ts`, `*.test.ts`, and their `.tsx`, `.js`, and `.jsx` equivalents. File names do not select the environment.

For React component and DOM tests, add `// @vitest-environment jsdom` at the top of the test file and import `src/setup.dom.ts` using a relative path. This setup provides DOM matchers and automatic cleanup after each test. For example, a test in `src/features/errors` starts with:

```ts
// @vitest-environment jsdom

import '../../setup.dom'
```

jsdom simulates browser APIs inside Node, so these tests can still access Node APIs. They do not run in a real browser. Tests without the environment comment use Node without browser globals or DOM setup.

Import test functions explicitly from `vitest`. Use React Testing Library to render components and `userEvent.setup()` with awaited interactions to test user behavior. Add Router or Query providers when a component requires them, creating independent instances for each test.

```sh
pnpm test
pnpm check
```

`pnpm test` runs all tests. To run a single file, pass its path, for example `pnpm test src/features/errors/NotFoundError.spec.tsx`. `pnpm check` runs lint, formatting, type checking, and tests.

Test server business logic and pure functions in the default Node environment. SSR, Server Function communication, and request context need integration tests against a running application. Unit tests do not load the Nitro or TanStack Start application plugins. Application and test TypeScript files share `tsconfig.app.json`.
