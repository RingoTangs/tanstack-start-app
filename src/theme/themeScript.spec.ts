// @vitest-environment jsdom

import { runInNewContext } from 'node:vm'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { THEME_STORAGE_KEY } from './theme'
import { themeScript } from './themeScript'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  document.documentElement.style.colorScheme = ''
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it.each([
  [null, false, 'light'],
  [null, true, 'dark'],
  ['light', true, 'light'],
  ['dark', false, 'dark'],
  ['system', true, 'dark'],
  ['unknown', true, 'dark'],
])('首屏脚本解析主题 %s，系统深色 %s → %s', (stored, systemDark, resolved) => {
  if (stored !== null) localStorage.setItem(THEME_STORAGE_KEY, stored)
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: systemDark })),
  )
  const persist = vi.spyOn(Storage.prototype, 'setItem')

  runInNewContext(themeScript, { window, document, localStorage })

  expect(document.documentElement.classList.contains('dark')).toBe(
    resolved === 'dark',
  )
  expect(document.documentElement.style.colorScheme).toBe(resolved)
  expect(persist).not.toHaveBeenCalled()
})

it('存储读取失败时仍应用系统深色', () => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: true })),
  )
  const context = {
    window,
    document,
    get localStorage() {
      throw new Error('Storage unavailable')
    },
  }

  runInNewContext(themeScript, context)

  expect(document.documentElement).toHaveClass('dark')
  expect(document.documentElement.style.colorScheme).toBe('dark')
})

it('缺少 matchMedia 时回退为浅色', () => {
  vi.stubGlobal('matchMedia', undefined)
  runInNewContext(themeScript, { window, document, localStorage })
  expect(document.documentElement.style.colorScheme).toBe('light')
})
