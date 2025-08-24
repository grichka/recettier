import '@testing-library/jest-dom'

declare module 'vitest' {
  interface Assertion<T = unknown> {
    toBeInTheDocument(): T
    toHaveValue(value: string | number | string[]): T
    toBeChecked(): T
    toBeDisabled(): T
    toBeEnabled(): T
    toBeVisible(): T
    toHaveClass(...classNames: string[]): T
    toHaveTextContent(text: string | RegExp): T
    toHaveAttribute(attr: string, value?: string): T
    toHaveStyle(style: string | Record<string, unknown>): T
  }
}