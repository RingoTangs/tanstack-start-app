# TanStack Start App

## Theme

The root document uses `ThemeProvider` and `getThemeScript()` from `@ringotangs/react-theme`. The synchronous head script applies the initial color scheme before the body is parsed, and the Provider restores the saved preference after hydration. Both use the package defaults: `system` mode, localStorage key `theme`, and the `dark` class on `<html>`. Tailwind's `dark:` variant follows that class.

Import `useTheme` and theme types directly from `@ringotangs/react-theme` in application components. The selected preference is saved when the user changes it; mounting does not write a default value or replace an invalid stored value. No Vite theme plugin is needed for this SSR document.

## Tests

Vitest runs a single test project using a configuration separate from the application. Tests use Node by default and follow Vitest's standard naming conventions, such as `*.spec.ts`, `*.test.ts`, and their `.tsx`, `.js`, and `.jsx` equivalents. File names do not select the environment.

Vitest automatically loads `src/setup.dom.ts` before each test file to provide DOM matchers. No manual setup import is needed. For React component and DOM tests, add this comment at the top of the test file:

```ts
// @vitest-environment jsdom
```

jsdom simulates browser APIs inside Node, so these tests can still access Node APIs. They do not run in a real browser. Tests without the environment comment use Node without browser globals. Loading the setup file does not create `window` or `document`.

Automatic component cleanup is not configured. When tests need to remove mounted components between cases in the same file, explicitly call `cleanup()` from `@testing-library/react`.

Import test functions explicitly from `vitest`. Use React Testing Library to render components and `userEvent.setup()` with awaited interactions to test user behavior. Add Router or Query providers when a component requires them, creating independent instances for each test.

```sh
pnpm test
pnpm check
```

`pnpm test` runs all tests. To run a single file, pass its path, for example `pnpm test src/features/errors/NotFoundError.spec.tsx`. `pnpm check` runs lint, formatting, type checking, and tests.

Test server business logic and pure functions in the default Node environment. SSR, Server Function communication, and request context need integration tests against a running application. Unit tests do not load the Nitro or TanStack Start application plugins. Application and test TypeScript files share `tsconfig.app.json`.
