import React, { useState } from "react";
import { SongTag } from "./ui/SongTag";
import { SquarePen } from "lucide-react";
import { YouTubeModal, getYouTubeVideoId } from "./YouTubeModal";

/**
 * SongCard - Horizontal card for displaying a song
 * Matches Figma design with glass effect container
 */
export function SongCard({ song, onEdit }) {
    const [isHovered, setIsHovered] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);

    // Check if video link is a YouTube link
    const isYouTubeLink = song.video_link && getYouTubeVideoId(song.video_link);

    return (
        <>
            <div
                className="group relative flex gap-[24px] items-center p-[20px] rounded-[24px] bg-[rgba(0,0,0,0.12)]"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Album Artwork */}
                <div className="relative w-[160px] h-[160px] rounded-[16px] overflow-hidden shrink-0">
                    {song.artwork_url ? (
                        <>
                            <img
                                src={song.artwork_url}
                                alt={`${song.title} artwork`}
                                className="w-full h-full object-cover"
                            />
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-[rgba(56,56,56,0.32)]" />
                        </>
                    ) : (
                        <div className="w-full h-full bg-[rgba(255,255,255,0.04)] flex items-center justify-center text-[rgba(255,255,255,0.48)] text-sm">
                            no cover
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-[24px]">
                    {/* Title, Artist & Description */}
                    <div className="flex flex-col gap-[12px]">
                        {/* Title & Artist - 0px gap */}
                        <div className="flex flex-col gap-0">
                            <h3 className="font-['Inter_Tight'] font-bold text-[22px] leading-[150%] text-[rgba(255,255,255,0.8)] truncate">
                                {song.title}
                            </h3>
                            <p className="font-['Inter_Tight'] font-normal text-[18px] leading-[150%] text-[rgba(255,255,255,0.48)]">
                                {song.artist}
                            </p>
                        </div>
                        {/* Description - after song+artist with 12px gap */}
                        {song.notes && (
                            <p className="font-['Inter'] font-normal text-[14px] leading-[150%] text-[rgba(255,255,255,0.48)] line-clamp-2">
                                {song.notes}
                            </p>
                        )}
                    </div>

                    {/* Tags */}
                    <div className="flex gap-[8px] items-center">
                        {song.tabs_link && <SongTag href={song.tabs_link}>Tabs</SongTag>}
                        {song.video_link && (
                            isYouTubeLink ? (
                                <SongTag onClick={() => setShowVideoModal(true)}>Video</SongTag>
                            ) : (
                                <SongTag href={song.video_link}>Video</SongTag>
                            )
                        )}
                    </div>
                </div>

                {/* Edit Button - tertiary style, appears on card hover (same as lesson card) */}
                {onEdit && (
                    <button
                        onClick={() => onEdit(song)}
                        className="group/edit absolute bottom-[24px] right-[24px] opacity-0 group-hover:opacity-100 transition-all duration-300 w-[44px] h-[44px] p-[12px] rounded-full flex items-center justify-center bg-[rgba(255,204,0,0.24)] hover:bg-[#fc0] border border-transparent hover:border-[#ebac00]"
                    >
                        <SquarePen size={20} strokeWidth={2} className="text-[#FFCC00] group-hover/edit:text-[#181723] transition-colors" />
                    </button>
                )}
            </div>

            {/* YouTube Modal */}
            <YouTubeModal
                open={showVideoModal}
                onClose={() => setShowVideoModal(false)}
                url={song.video_link}
                title={`${song.title} - ${song.artist}`}
            />
        </>
    );
}
