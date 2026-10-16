import {
  getThemeScript,
  ThemeProvider,
  useTheme,
} from '@ringotangs/react-theme'
import { renderToString } from 'react-dom/server'
import { expect, it } from 'vitest'

function Consumer() {
  const { theme, resolvedTheme } = useTheme()
  return (
    <span>
      {theme}/{resolvedTheme}
    </span>
  )
}

it('包的默认配置无需浏览器 API 即可完成 SSR 和脚本生成', () => {
  expect(typeof window).toBe('undefined')
  expect(
    renderToString(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    ),
  ).toBe('<span>system<!-- -->/<!-- -->light</span>')
  expect(getThemeScript()).toContain('window.localStorage.getItem("theme")')
})
