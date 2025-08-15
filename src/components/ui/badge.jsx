import * as React from 'react'
import { cn } from './utils'

export function Badge({ className, variant='outline', ...props }) {
  const base = 'inline-flex items-center rounded-full border px-2 py-0.5 text-xs'
  const styles = {
    outline: 'border-neutral-700 text-neutral-200',
    solid: 'bg-neutral-800 text-neutral-100 border-transparent',
  }
  return <span className={cn(base, styles[variant], className)} {...props} />
}