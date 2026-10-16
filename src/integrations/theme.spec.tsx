// @vitest-environment jsdom

import { runInNewContext } from 'node:vm'
import {
  getThemeScript,
  ThemeProvider,
  useTheme,
} from '@ringotangs/react-theme'
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

function Consumer() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  return (
    <>
      <output>
        {theme}/{resolvedTheme}
      </output>
      <button type="button" onClick={() => setTheme('dark')}>
        Dark
      </button>
      <button type="button" onClick={() => setTheme('system')}>
        System
      </button>
    </>
  )
}

function installMatchMedia() {
  let matches = false
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      get matches() {
        return matches
      },
      addEventListener(
        _type: string,
        listener: (event: MediaQueryListEvent) => void,
      ) {
        listeners.add(listener)
      },
      removeEventListener(
        _type: string,
        listener: (event: MediaQueryListEvent) => void,
      ) {
        listeners.delete(listener)
      },
    })),
  )
  return (dark: boolean) => {
    matches = dark
    listeners.forEach((listener) =>
      listener({ matches } as MediaQueryListEvent),
    )
  }
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

it('根文档使用的脚本和 Provider 恢复已有偏好，hydration 不覆盖首屏配色或存储', async () => {
  installMatchMedia()
  localStorage.setItem('theme', 'dark')
  const app = (
    <StrictMode>
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    </StrictMode>
  )
  const container = document.createElement('div')
  container.innerHTML = renderToString(app)
  document.body.append(container)
  expect(container).toHaveTextContent('system/light')

  runInNewContext(getThemeScript(), { window, document })
  expect(document.documentElement).toHaveClass('dark')
  const mutations: string[] = []
  const observer = new MutationObserver((records) => {
    for (const record of records) mutations.push(record.oldValue ?? '')
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
    attributeOldValue: true,
  })
  const persist = vi.spyOn(Storage.prototype, 'setItem')
  const onRecoverableError = vi.fn()
  const consoleError = vi.spyOn(console, 'error')
  let root: ReturnType<typeof hydrateRoot> | undefined
  try {
    await act(async () => {
      root = hydrateRoot(container, app, { onRecoverableError })
    })
    expect(container).toHaveTextContent('dark/dark')
    expect(onRecoverableError).not.toHaveBeenCalled()
    expect(consoleError).not.toHaveBeenCalled()
    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(
      mutations.every((value) => value.split(/\s+/).includes('dark')),
    ).toBe(true)
    expect(persist).not.toHaveBeenCalled()
    expect(localStorage.getItem('theme')).toBe('dark')
  } finally {
    observer.disconnect()
    await act(async () => root?.unmount())
    container.remove()
  }
})

it('手动切换同步配色和存储，system 模式响应系统变化', async () => {
  const updateSystem = installMatchMedia()
  const user = userEvent.setup()
  render(
    <ThemeProvider>
      <Consumer />
    </ThemeProvider>,
  )

  expect(screen.getByRole('status')).toHaveTextContent('system/light')
  expect(localStorage.getItem('theme')).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Dark' }))
  expect(screen.getByRole('status')).toHaveTextContent('dark/dark')
  expect(document.documentElement).toHaveClass('dark')
  expect(document.documentElement.style.colorScheme).toBe('dark')
  expect(localStorage.getItem('theme')).toBe('dark')

  await user.click(screen.getByRole('button', { name: 'System' }))
  expect(screen.getByRole('status')).toHaveTextContent('system/light')
  expect(document.documentElement).not.toHaveClass('dark')
  expect(localStorage.getItem('theme')).toBe('system')
  act(() => updateSystem(true))
  expect(screen.getByRole('status')).toHaveTextContent('system/dark')
  expect(document.documentElement).toHaveClass('dark')
})

it('跨标签页同步 theme 偏好，清空存储后恢复 system', () => {
  installMatchMedia()
  render(
    <ThemeProvider>
      <Consumer />
    </ThemeProvider>,
  )
  act(() => {
    localStorage.setItem('theme', 'dark')
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'theme',
        newValue: 'dark',
        storageArea: localStorage,
      }),
    )
  })
  expect(screen.getByRole('status')).toHaveTextContent('dark/dark')
  expect(document.documentElement).toHaveClass('dark')
  act(() => {
    localStorage.clear()
    window.dispatchEvent(
      new StorageEvent('storage', { key: null, storageArea: localStorage }),
    )
  })
  expect(screen.getByRole('status')).toHaveTextContent('system/light')
  expect(document.documentElement).not.toHaveClass('dark')
  expect(localStorage.getItem('theme')).toBeNull()
})
