import React from "react";

/**
 * CategoryTabs - Pill-style filter tabs for song categories
 * Active tab: filled bg, white border, white text
 * Inactive tab: transparent bg, white border, muted text
 */
export function CategoryTabs({ categories, activeCategory, onCategoryChange }) {
    return (
        <div className="flex gap-[8px] items-center">
            {categories.map((category) => {
                const isActive = category.value === activeCategory;
                return (
                    <button
                        key={category.value}
                        onClick={() => onCategoryChange(category.value)}
                        className={`
              font-['Inter_Tight'] font-semibold text-[14px] leading-[150%]
              px-[24px] py-[12px] rounded-full border transition-all flex items-center gap-[8px]
              ${isActive
                                ? "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.24)] text-white"
                                : "bg-transparent border-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,255,255,0.04)]"
                            }
            `}
                    >
                        <span>{category.label}</span>
                        {category.count !== undefined && (
                            <span className="text-[14px] font-semibold text-[rgba(255,255,255,0.32)]">
                                {category.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
