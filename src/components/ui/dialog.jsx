import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from './utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger

// Radix-compliant Title & Description (used by your App.jsx markup)
export const DialogTitle = React.forwardRef(function DialogTitle(
  { className, ...props },
  ref
) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn('text-lg font-semibold text-neutral-100', className)}
      {...props}
    />
  )
})

export const DialogDescription = React.forwardRef(function DialogDescription(
  { className, ...props },
  ref
) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn('text-sm text-neutral-400', className)}
      {...props}
    />
  )
})

// Overlay + Content
export function DialogContent({ className, children, ...props }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/60" />
      <DialogPrimitive.Content
        className={cn(
          'fixed z-50 grid w-full max-w-lg gap-4 rounded-xl border border-neutral-800',
          'bg-neutral-900 p-4 text-neutral-100 shadow-lg',
          'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
          className
        )}
        {...props}
      >
        {children}

        {/* Close button (optional, invisible if you already render one) */}
        {/* <DialogPrimitive.Close className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-200">
          ×
        </DialogPrimitive.Close> */}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

// Simple layout helpers (your App.jsx already uses these names)
export function DialogHeader({ className, ...props }) {
  return <div className={cn('flex flex-col space-y-1.5', className)} {...props} />
}

export function DialogFooter({ className, ...props }) {
  return <div className={cn('flex justify-end gap-2', className)} {...props} />
}