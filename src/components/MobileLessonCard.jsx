import React from "react";
import { Pill } from "./ui/pill";

export function MobileLessonCard({ lesson, previousCount, className }) {
    // Use same date format as desktop: "10 Dec 2025"
    const dateStr = new Date(lesson.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <div className={`relative w-full h-full rounded-[24px] overflow-hidden border border-[#3f3069]/50 bg-[#16141a] flex flex-col ${className}`}>
            {/* Mobile Header - matches desktop styling */}
            <div className="flex items-center justify-between px-[20px] py-[12px] border-b border-[#2c2a30]">
                <span className="text-[rgba(255,255,255,0.48)] font-medium font-['Inter_Tight'] text-[12px] leading-[20px] tracking-[0.04em] uppercase">{dateStr}</span>
                <div className="text-[12px] font-medium font-['Inter_Tight'] text-[rgba(255,255,255,0.48)] leading-[20px] tracking-[0.04em] uppercase">
                    <span className="font-bold text-[rgba(255,255,255,0.72)]">{previousCount}</span> lessons remaining
                </div>
            </div>

            {/* Content */}
            <div className="py-[36px] px-[24px] flex-1 overflow-y-auto">
                <div className="flex flex-wrap gap-2 mb-[36px]">
                    {lesson.songs && lesson.songs.map((song, i) => (
                        <Pill key={i} isMobile={true}>{song.title} — {song.artist}</Pill>
                    ))}
                </div>
                <p className="whitespace-pre-wrap text-[16px] leading-[1.5] text-white/90">
                    {lesson.notes}
                </p>
            </div>
        </div>
    );
}
