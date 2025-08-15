import * as React from 'react'
import { cn } from './utils'

export function Card({ className, ...props }) {
  return <div className={cn('rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100', className)} {...props} />
}
export function CardHeader({ className, ...props }) {
  return <div className={cn('p-4', className)} {...props} />
}
export function CardTitle({ className, ...props }) {
  return <h3 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
}
export function CardContent({ className, ...props }) {
  return <div className={cn('p-4 pt-0', className)} {...props} />
}