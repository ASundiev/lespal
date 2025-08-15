import * as React from 'react'
import { cn } from './utils'

export const Input = React.forwardRef(({ className, type='text', ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      'flex h-9 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/40',
      className
    )}
    {...props}
  />
))
Input.displayName = 'Input'