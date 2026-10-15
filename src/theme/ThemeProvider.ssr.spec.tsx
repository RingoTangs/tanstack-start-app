import { renderToString } from 'react-dom/server'
import { afterEach, expect, it, vi } from 'vitest'
import { ThemeProvider, useTheme } from './index'
import { getSystemTheme } from './theme'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

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

it.each([undefined, '', '   '])(
  '存储键未配置或为空时使用默认值（%s）',
  async (key) => {
    vi.stubEnv('VITE_THEME_STORAGE_KEY', key)
    const { THEME_STORAGE_KEY } = await import('./theme')
    expect(THEME_STORAGE_KEY).toBe('app-theme')
  },
)

it('保留环境变量覆盖并去除首尾空白', async () => {
  vi.stubEnv('VITE_THEME_STORAGE_KEY', ' custom-theme ')
  const { THEME_STORAGE_KEY } = await import('./theme')
  expect(THEME_STORAGE_KEY).toBe('custom-theme')
})
