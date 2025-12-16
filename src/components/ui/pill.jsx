import React from "react";
import { cn } from "./utils";

export function Pill({ className, children, isMobile = false }) {
    return (
        <div
            className={cn(
                "bg-[rgba(255,255,255,0.08)] flex items-center justify-center overflow-hidden px-[12px] py-[4px] rounded-full whitespace-nowrap",
                className
            )}
        >
            <p
                className={cn(
                    "font-medium leading-[20px] text-[#6ee7b7]",
                    isMobile ? "text-[14px] tracking-[0.56px]" : "text-[11px] tracking-[0.44px]"
                )}
            >
                {children}
            </p>
        </div>
    );
}
