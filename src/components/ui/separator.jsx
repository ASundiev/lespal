import { cn } from './utils'
export function Separator({ className, orientation='horizontal', ...props }) {
  return (
    <div
      className={cn(
        'bg-neutral-800',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className
      )}
      {...props}
    />
  )
}