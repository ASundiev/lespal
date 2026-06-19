import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { getYouTubeVideoId } from "@/lib/youtube";

/**
 * YouTubeModal - Modal with embedded YouTube player
 */
export function YouTubeModal({ open, onClose, url, title }) {
    const videoId = getYouTubeVideoId(url);

    if (!videoId) return null;

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className="sm:max-w-4xl p-0 bg-black border-[rgba(255,255,255,0.12)] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-[16px] py-[12px] border-b border-[rgba(255,255,255,0.12)]">
                    <DialogTitle className="font-['Inter_Tight'] font-semibold text-[16px] text-white truncate pr-4">
                        {title || 'Video'}
                    </DialogTitle>
                    <button
                        type="button"
                        aria-label="Close video"
                        onClick={onClose}
                        className="p-[8px] rounded-full hover:bg-[rgba(255,255,255,0.08)] transition-colors"
                    >
                        <X size={20} className="text-[rgba(255,255,255,0.64)]" />
                    </button>
                </div>

                {/* YouTube Embed */}
                <div className="relative w-full aspect-video">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                        title={title || 'YouTube video'}
                        loading="lazy"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
