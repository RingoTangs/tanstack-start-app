# TanStack Start App

[English](./README.md) | 简体中文

基于 TanStack Start、React、TypeScript、TanStack Query 和 Tailwind CSS 的启动项目，使用 Vite 和 Nitro 进行开发与生产构建。包含计数器、Streaming SSR 和路由加载示例、主题管理，以及默认加载、404 和错误页面。

## 快速开始

使用 [package.json](./package.json) 指定的 Node.js **22.23.2** 和 pnpm **10.24.0**。Node 版本也记录在 `.nvmrc` 中。

```sh
pnpm install
pnpm dev
```

访问 <http://localhost:3000>。本地构建并预览：

```sh
pnpm build
pnpm preview
```

开发和预览均默认使用端口 `3000`，配置位于 [vite.config.ts](./vite.config.ts)。使用相同端口预览前，请先停止开发服务器。生产构建产物位于 `.output/`。

## 常用命令

| 命令                              | 用途                                                         |
| --------------------------------- | ------------------------------------------------------------ |
| `pnpm dev`                        | 启动开发服务器                                               |
| `pnpm build`                      | 构建客户端和 SSR 服务端                                      |
| `pnpm preview`                    | 在本地预览已有生产构建                                       |
| `pnpm lint` / `pnpm lint:fix`     | 检查 ESLint 规则 / 应用可用的自动修复                        |
| `pnpm format` / `pnpm format:fix` | 检查格式 / 使用 Prettier 格式化文件                          |
| `pnpm typecheck`                  | 使用 `tsc -p tsconfig.json` 检查类型                         |
| `pnpm test`                       | 运行 Vitest 测试                                             |
| `pnpm check`                      | 依次运行 lint、格式、类型检查和测试                          |
| `pnpm check:fix`                  | 执行 ESLint 自动修复和 Prettier 格式化，不包含类型检查和测试 |

## 示例页面

| 路由         | 行为                                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| `/`          | 支持加一、减一和重置的计数器，每次挂载从 0 开始，不持久化                                                |
| `/streaming` | loader 返回未完成的 Promise，两个独立的 `Await` 边界分别在约 1.2 秒后展示统计概览、约 3 秒后展示最近动态 |
| `/pending`   | 等待一个模拟的 2 秒任务后才渲染页面，使用路由器默认的 `RouterPending` 组件                               |

观察 **SSR streaming** 时，直接访问或完整刷新 `/streaming`：页面外壳和占位先返回，延迟内容随后到达。通过客户端导航进入该页面，展示的则是浏览器中的渐进加载。

观察**路由 Pending** 时，从首页点击 `/pending` 链接。约 150ms 后显示 `RouterPending`，一旦显示，至少保持 300ms；任务完成后展示目标页面。返回首页再进入可以重复观察，该路由设置了 `gcTime: 0`，避免保留离开后的 loader 数据。直接访问或刷新走的是 SSR，不用于观察这段客户端导航过程。

首页的两个示例链接均关闭了预加载，避免悬停时提前启动任务。两个示例都使用本地模拟数据和 Router loader 数据，没有使用 Query 缓存。

## 路由与数据

- [src/router.tsx](./src/router.tsx) 创建路由器，配置默认加载、404 和错误组件，并接入 TanStack Query 的 SSR 集成。
- [src/context.ts](./src/context.ts) 为每个路由器创建一个 `QueryClient`。SSR 请求使用独立实例，浏览器导航复用其路由器持有的实例。Query 默认 `staleTime` 为 30 秒，表示数据的新鲜时间，并非轮询间隔。
- Router 协调导航和 loader 执行，Query 可以负责业务数据请求、缓存和失效更新。新增由 Query 管理数据的页面时，在 loader 和组件间复用 `queryOptions()`。
- `defaultPreloadStaleTime: 0` 让 Query 判断预加载是否需要获取新数据。`setupRouterSsrQueryIntegration` 提供 Query Provider，并处理脱水、水合和 streaming，无需再创建第二个 QueryClient 或重复包裹 Provider。

文件路由位于 `src/routes`。运行 Vite 开发或构建会生成 `src/routeTree.gen.ts`，不要手动编辑。新增或删除路由后，先运行开发或构建，再进行类型检查。

应用代码、测试及 Vite/Vitest 配置共用 [tsconfig.json](./tsconfig.json)。`@/*` 别名映射到 `src/*`，Vite 和 Vitest 均会解析该别名。

## 主题与样式

[根文档](./src/routes/__root.tsx) 使用 `@ringotangs/react-theme` 的 `ThemeProvider` 和 `getThemeScript()`，两者均使用包的默认配置：`system` 模式、localStorage 键 `theme`，以及 `<html>` 上的 `dark` 类名。

head 中的同步脚本在 body 解析前应用首屏配色，Provider 在 hydration 后恢复已保存的偏好。`<html suppressHydrationWarning>` 用于容纳脚本在 hydration 前对根元素 class 和 style 的预期修改，不会关闭整个组件树的检查。此 SSR 文档无需接入 Vite 主题插件。

在组件中直接从 `@ringotangs/react-theme` 导入 `useTheme` 和主题类型。用户切换时保存偏好；挂载本身不会写入默认值或替换无效的存储值。

Tailwind CSS 从 `src/styles/index.css` 加载，主题变量位于 `src/styles/theme.css`。`dark:` 变体跟随根元素的 `dark` 类名。

## 测试

Vitest 使用独立于应用的 [vitest.config.ts](./vitest.config.ts)。测试默认在 Node 环境运行，遵循 `*.spec.ts`、`*.test.ts` 以及对应 `.tsx`、`.js`、`.jsx` 等命名约定。文件名本身不会决定测试环境。

测试与对应代码放在同一目录，例如 [src/components/Button.spec.tsx](./src/components/Button.spec.tsx)。路由行为测试位于 [src/router.spec.tsx](./src/router.spec.tsx)，不放进 `src/routes`，避免被识别成页面。本项目不重复测试第三方包内部实现。

React 组件和 DOM 测试需在文件顶部声明：

```ts
// @vitest-environment jsdom
```

jsdom 在 Node 中模拟浏览器 API，不是真实浏览器测试。Vitest 会在每份测试文件前加载 `src/setup.dom.ts`，提供 DOM 断言，无需手动导入；仅加载此初始化文件不会创建 `window` 或 `document`。

项目未配置组件自动清理。挂载组件的测试应显式调用 React Testing Library 的 `cleanup()`，例如使用 `afterEach(cleanup)`。测试函数从 `vitest` 显式导入；用户交互使用 React Testing Library 和等待完成的 `userEvent`，精确时序检查可使用受控事件与虚拟定时器。需要 Router 或 Query 时，为测试创建独立实例。

运行单份测试文件：

```sh
pnpm test src/components/Button.spec.tsx
```

纯函数和服务端业务逻辑可以在 Node 中测试，组件 SSR 输出可通过 React 服务端渲染 API 测试。验证 Nitro/Start 请求上下文、Server Function 通信或实际 streaming 时，需要针对完整应用进行集成检查。当前 Vitest 配置不会加载 Nitro 或 TanStack Start 应用插件。

## 许可

[MIT](./LICENSE)
