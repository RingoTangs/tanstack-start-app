// @vitest-environment jsdom

import { runInNewContext } from 'node:vm'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider, useTheme } from '@/theme'
import { THEME_STORAGE_KEY } from './theme'
import { themeScript } from './themeScript'

const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)'

const installMatchMedia = (initialMatches = false) => {
  let matches = initialMatches
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  const addEventListener = vi.fn(
    (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener)
    },
  )
  const removeEventListener = vi.fn(
    (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener)
    },
  )
  const mediaQueryList = {
    get matches() {
      return matches
    },
    media: SYSTEM_THEME_QUERY,
    onchange: null,
    addEventListener,
    removeEventListener,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  } as unknown as MediaQueryList

  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mediaQueryList),
  )

  return {
    listeners,
    setMatches(nextMatches: boolean) {
      matches = nextMatches
      const event = {
        matches,
        media: SYSTEM_THEME_QUERY,
      } as MediaQueryListEvent
      listeners.forEach((listener) => listener(event))
    },
  }
}

const ThemeConsumer: React.FC = () => {
  const { theme, resolvedTheme, setTheme } = useTheme()

  return (
    <>
      <output data-testid="theme">{theme}</output>
      <output data-testid="resolved-theme">{resolvedTheme}</output>
      <button type="button" onClick={() => setTheme('light')}>
        Light
      </button>
      <button type="button" onClick={() => setTheme('dark')}>
        Dark
      </button>
      <button type="button" onClick={() => setTheme('system')}>
        System
      </button>
    </>
  )
}

function HydrationConsumer({
  onRender,
}: {
  onRender: (theme: string, resolvedTheme: string) => void
}) {
  const { theme, resolvedTheme } = useTheme()
  onRender(theme, resolvedTheme)
  return (
    <span>
      {theme}/{resolvedTheme}
    </span>
  )
}

const renderTheme = () => {
  return render(
    <ThemeProvider>
      <ThemeConsumer />
    </ThemeProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  document.documentElement.style.colorScheme = ''
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('theme provider', () => {
  it('默认跟随浅色系统主题', () => {
    installMatchMedia()
    renderTheme()

    expect(screen.getByTestId('theme')).toHaveTextContent('system')
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light')
    expect(document.documentElement).not.toHaveClass('dark')
    expect(document.documentElement.style.colorScheme).toBe('light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system')
  })

  it('恢复已保存的深色主题', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    installMatchMedia()
    renderTheme()

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark')
    expect(document.documentElement).toHaveClass('dark')
  })

  it('无效存储值回退为 system', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'unknown')
    installMatchMedia(true)
    renderTheme()

    expect(screen.getByTestId('theme')).toHaveTextContent('system')
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system')
  })

  it('切换主题时同步 DOM 和存储', () => {
    installMatchMedia()
    renderTheme()

    fireEvent.click(screen.getByRole('button', { name: 'Dark' }))
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')

    fireEvent.click(screen.getByRole('button', { name: 'Light' }))
    expect(document.documentElement).not.toHaveClass('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })

  it('system 模式响应系统变化，显式主题保持不变', () => {
    const media = installMatchMedia()
    renderTheme()

    act(() => media.setMatches(true))
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark')
    expect(document.documentElement).toHaveClass('dark')

    fireEvent.click(screen.getByRole('button', { name: 'Light' }))
    act(() => media.setMatches(false))
    act(() => media.setMatches(true))
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light')
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('响应其他标签页的主题变化', () => {
    installMatchMedia()
    renderTheme()

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: THEME_STORAGE_KEY,
          newValue: 'dark',
        }),
      )
    })

    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(document.documentElement).toHaveClass('dark')
  })

  it('strict mode 卸载后清理系统主题监听', () => {
    const media = installMatchMedia()
    const { unmount } = render(
      <StrictMode>
        <ThemeProvider>
          <ThemeConsumer />
        </ThemeProvider>
      </StrictMode>,
    )

    expect(media.listeners.size).toBe(1)
    unmount()
    expect(media.listeners.size).toBe(0)
  })

  it.each([THEME_STORAGE_KEY, null])(
    '删除主题或清空存储时回退为 system（%s）',
    (key) => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark')
      installMatchMedia()
      renderTheme()

      act(() => {
        localStorage.clear()
        window.dispatchEvent(new StorageEvent('storage', { key }))
      })

      expect(screen.getByTestId('theme')).toHaveTextContent('system')
      expect(document.documentElement).not.toHaveClass('dark')
    },
  )

  it('忽略 sessionStorage 和其他存储键的事件', () => {
    installMatchMedia()
    renderTheme()

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: THEME_STORAGE_KEY,
          newValue: 'dark',
          storageArea: sessionStorage,
        }),
      )
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'another-setting',
          newValue: 'dark',
        }),
      )
    })

    expect(screen.getByTestId('theme')).toHaveTextContent('system')
  })

  it('系统主题变化不重复持久化用户偏好', () => {
    const media = installMatchMedia()
    renderTheme()
    const persist = vi.spyOn(Storage.prototype, 'setItem')

    act(() => media.setMatches(true))

    expect(document.documentElement).toHaveClass('dark')
    expect(persist).not.toHaveBeenCalled()
  })

  it('存储不可用时仍能跟随系统并切换主题', () => {
    installMatchMedia(true)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage unavailable')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage unavailable')
    })
    renderTheme()

    expect(document.documentElement).toHaveClass('dark')
    fireEvent.click(screen.getByRole('button', { name: 'Light' }))
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('matchMedia 不可用时回退为浅色并允许手动切换', () => {
    vi.stubGlobal('matchMedia', undefined)
    renderTheme()

    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light')
    fireEvent.click(screen.getByRole('button', { name: 'Dark' }))
    expect(document.documentElement).toHaveClass('dark')
  })

  it('hydration 首次状态与 SSR 一致，恢复期间不覆盖首屏深色或存储', async () => {
    installMatchMedia()
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    const snapshots = vi.fn()
    const app = (
      <StrictMode>
        <ThemeProvider>
          <HydrationConsumer onRender={snapshots} />
        </ThemeProvider>
      </StrictMode>
    )
    const container = document.createElement('div')
    container.innerHTML = renderToString(app)
    document.body.append(container)
    expect(container).toHaveTextContent('system/light')
    snapshots.mockClear()

    runInNewContext(themeScript, { window, document, localStorage })
    expect(document.documentElement).toHaveClass('dark')
    const toggle = vi.spyOn(document.documentElement.classList, 'toggle')
    const persist = vi.spyOn(Storage.prototype, 'setItem')
    const onRecoverableError = vi.fn()
    const consoleError = vi.spyOn(console, 'error')
    let root: ReturnType<typeof hydrateRoot> | undefined
    try {
      await act(async () => {
        root = hydrateRoot(container, app, { onRecoverableError })
      })

      expect(snapshots.mock.calls[0]).toEqual(['system', 'light'])
      expect(container).toHaveTextContent('dark/dark')
      expect(onRecoverableError).not.toHaveBeenCalled()
      expect(consoleError).not.toHaveBeenCalled()
      expect(toggle).toHaveBeenCalledWith('dark', true)
      expect(toggle).not.toHaveBeenCalledWith('dark', false)
      expect(persist).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'dark')
      expect(persist).not.toHaveBeenCalledWith(THEME_STORAGE_KEY, 'system')
    } finally {
      await act(async () => root?.unmount())
      container.remove()
    }
  })

  it('在 Provider 外使用时抛出错误', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<ThemeConsumer />)).toThrow(
      'useTheme must be used within a ThemeProvider',
    )

    consoleError.mockRestore()
  })
})
