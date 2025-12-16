import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from './utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-nowrap rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-lespal-yellow text-lespal-dark font-medium shadow-[0px_18px_7px_0px_rgba(255,200,0,0.01),0px_12px_7px_0px_rgba(255,200,0,0.06),0px_7px_6px_0px_rgba(255,200,0,0.2),0px_3px_4px_0px_rgba(255,200,0,0.34),0px_1px_2px_0px_rgba(255,200,0,0.39)] border-[1.02px] border-transparent hover:border-[#ebac00] hover:shadow-none',
        // Secondary with white border - works for both icon and text
        secondary: 'border-[1.02px] border-white bg-transparent text-[rgba(255,255,255,0.8)] font-medium hover:bg-white/10',
        // Secondary with gradient - the purple/blue gradient variant
        'secondary-gradient': 'border-[1.02px] border-[rgba(173,167,255,0.39)] bg-gradient-to-br from-[rgba(188,183,255,0.16)] to-[rgba(47,41,112,0.08)] text-white font-medium hover:brightness-110',
        // Glass variant - complex gradient borders handled by GlassEffects
        glass: 'bg-transparent text-white/80 font-medium hover:text-white',
        tertiary: 'bg-[rgba(255,204,0,0.24)] text-[#FFCC00] font-medium hover:bg-[#fc0] hover:text-[#181723] hover:border-[#ebac00]',
        ghost: 'bg-transparent hover:bg-neutral-800/60 text-neutral-200',
      },
      size: {
        default: 'px-[24px] py-[16px] text-[16px]',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-10 px-8',
        icon: 'size-[44px] p-[12px]', // 20px icon + 12px padding each side = 44px
        'icon-large': 'size-[88px] p-[24px]', // 40px icon + 24px padding each side = 88px
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

// Custom renders for complex variants
const GlassEffects = () => (
  <>
    {/* Normal State: Gradient Border */}
    <div
      className="absolute inset-0 rounded-full p-[1px] pointer-events-none transition-opacity duration-300 group-hover:opacity-0"
      style={{
        background: 'linear-gradient(104.59deg, rgba(255, 255, 255, 0.12) 0.76%, rgba(255, 255, 255, 0.0307) 32.78%, rgba(255, 255, 255, 0.0882) 69.11%, rgba(255, 255, 255, 0.0084) 99%)',
        mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        maskComposite: 'exclude',
        WebkitMaskComposite: 'xor'
      }}
    />
    {/* Hover State: Specific Gradient Background + Solid Border */}
    <div
      className="absolute inset-0 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-[#59567C]"
      style={{
        background: 'linear-gradient(68.35deg, rgba(188, 183, 255, 0.16) 3.81%, rgba(47, 41, 112, 0.08) 113.08%)'
      }}
    />
  </>
);

export const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? React.Fragment : "button"

  // If variant is glass, we need a relative container for the effects. 
  // But wait, the effects need to sit *behind* the content but *inside* the button?
  // Or the button itself is the relative container?
  // In App.jsx, the structure was: <div relative group> <div effects> <Button z-10> ... </Button> </div>
  // So the Button itself wasn't the container of the effects, a wrapper was.
  // To encapsulate this in Button, we should make Button the container.

  const isGlass = variant === 'glass';

  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), isGlass && "relative group border-none bg-transparent overflow-hidden", className)}
      {...props}
    >
      {isGlass && <GlassEffects />}
      <span className="relative z-10 flex items-center gap-2">
        {props.children}
      </span>
    </button>
  )
})
Button.displayName = 'Button'