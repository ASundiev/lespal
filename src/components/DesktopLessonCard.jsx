import React, { useState } from "react";
import { Pill } from "./ui/pill";
import { SquarePen } from "lucide-react";

export function DesktopLessonCard({ lesson, previousCount, className, showShadow = true, onEdit }) {
    // Format date: "10 Dec 2025"
    const dateStr = new Date(lesson.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    // Track hover state for border gradient change (only for front card with onEdit)
    const [isHovered, setIsHovered] = useState(false);

    // Border gradient changes on hover
    const borderGradient = isHovered && onEdit
        ? 'linear-gradient(267.73deg, #3F3069 1.5%, #2E6449 99.17%)'
        : 'linear-gradient(267.73deg, #2C2A30 1.5%, #2E3437 99.17%)';

    return (
        <div
            className={`group relative w-full min-h-[480px] max-h-[800px] rounded-[24px] overflow-hidden flex flex-col ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                background: 'linear-gradient(217.06deg, #191719 21.52%, #171C1F 102.2%)',
                boxShadow: showShadow ? '0px 2px 0px 2px rgba(17, 19, 23, 0.64)' : 'none',
                // Border gradient trick: 1px border with gradient
                border: '1px solid transparent',
                backgroundImage: `linear-gradient(217.06deg, #191719 21.52%, #171C1F 102.2%), ${borderGradient}`,
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
                transition: 'background-image 0.3s ease',
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-[24px] py-[12px] border-b border-[#2c2a30]">
                {/* 12px Inter Tight Medium uppercase tracking 0.04em color 48% */}
                <span className="text-[rgba(255,255,255,0.48)] font-medium font-['Inter_Tight'] text-[12px] leading-[20px] tracking-[0.04em] uppercase">{dateStr}</span>
                <div className="text-[12px] font-medium font-['Inter_Tight'] text-[rgba(255,255,255,0.48)] leading-[20px] tracking-[0.04em] uppercase">
                    <span className="font-bold text-[rgba(255,255,255,0.72)]">{previousCount}</span> lessons remaining
                </div>
            </div>

            {/* Content */}
            <div className="p-[36px] flex-1 overflow-y-auto">
                {/* Songs Pills */}
                <div className="flex flex-wrap gap-[36px] mb-[36px]">
                    {lesson.songs && lesson.songs.map((song, i) => (
                        <Pill key={i}>{song.title} — {song.artist}</Pill>
                    ))}
                </div>

                {/* Notes */}
                <div className="prose prose-invert max-w-none">
                    <p className="whitespace-pre-wrap font-['Inter'] font-normal text-[16px] leading-[150%] text-white/88">
                        {lesson.notes}
                    </p>
                </div>
            </div>

            {/* Edit Button - tertiary style, appears on card hover */}
            {onEdit && (
                <button
                    onClick={() => onEdit(lesson)}
                    className="group/edit absolute bottom-[24px] right-[24px] opacity-0 group-hover:opacity-100 transition-all duration-300 w-[44px] h-[44px] p-[12px] rounded-full flex items-center justify-center bg-[rgba(255,204,0,0.24)] hover:bg-[#fc0] border border-transparent hover:border-[#ebac00]"
                >
                    <SquarePen size={20} strokeWidth={2} className="text-[#FFCC00] group-hover/edit:text-[#181723] transition-colors" />
                </button>
            )}
        </div>
    );
}
