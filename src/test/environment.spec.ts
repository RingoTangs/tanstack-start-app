import { createHash } from 'node:crypto'
import { expect, it } from 'vitest'

it('runs without browser globals', () => {
  expect(typeof window).toBe('undefined')
  expect(typeof document).toBe('undefined')
})

it('supports Node built-in modules', () => {
  expect(createHash('sha256').update('hello').digest('hex')).toBe(
    '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
  )
})
