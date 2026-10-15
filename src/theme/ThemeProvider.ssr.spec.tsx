import { renderToString } from 'react-dom/server'
import { expect, it } from 'vitest'
import { ThemeProvider, useTheme } from './index'
import { getSystemTheme } from './theme'

function Consumer() {
  const { theme, resolvedTheme } = useTheme()
  return (
    <span>
      {theme}/{resolvedTheme}
    </span>
  )
}

it('在 Node 环境中以固定主题状态完成 SSR', () => {
  expect(typeof window).toBe('undefined')
  expect(getSystemTheme()).toBe('light')
  expect(
    renderToString(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    ),
  ).toBe('<span>system<!-- -->/<!-- -->light</span>')
})
