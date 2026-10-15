// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { NotFoundError } from './NotFoundError'

it('renders the page not found message in the DOM', () => {
  render(<NotFoundError />)

  expect(screen.getByText('Page NotFound')).toBeInTheDocument()
})
