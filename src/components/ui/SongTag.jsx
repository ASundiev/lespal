import React from "react";

/**
 * SongTag - Small tag component for Tabs/Video links on song cards
 * Normal: subtle bg, border, muted text
 * Hover: yellow bg, yellow text
 */
export function SongTag({ href, onClick, children }) {
    const isLink = !!href;
    const isInteractive = isLink || !!onClick;
    const Tag = isLink ? "a" : "button";
    const linkProps = isLink ? { href, target: "_blank", rel: "noreferrer" } : {};
    const buttonProps = onClick ? { onClick, type: "button" } : {};

    return (
        <Tag
            {...linkProps}
            {...buttonProps}
            className={`
        inline-flex items-center gap-[8px]
        font-['Inter_Tight'] font-semibold text-[12px] leading-[150%]
        px-[12px] py-[4px] rounded-[8px] transition-all
        bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)]
        text-[rgba(255,255,255,0.8)]
        ${isInteractive ? "cursor-pointer hover:bg-[rgba(255,204,0,0.24)] hover:border-transparent hover:text-[#fc0]" : ""}
      `}
        >
            {children}
        </Tag>
    );
}
