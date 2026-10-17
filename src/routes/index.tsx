import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
      <p className="mt-4 text-lg">
        Edit <code>src/routes/index.tsx</code> to get started.
      </p>
      <Link
        to="/streaming"
        preload={false}
        className="text-primary mt-6 inline-block underline underline-offset-4"
      >
        查看 Streaming SSR 示例 →
      </Link>
      <div className="mt-4">
        <Link
          to="/pending"
          preload={false}
          className="text-primary underline underline-offset-4"
        >
          查看全局 Pending 示例 →
        </Link>
      </div>
    </div>
  )
}
