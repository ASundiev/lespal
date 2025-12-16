import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
function getYouTubeVideoId(url) {
    if (!url) return null;

    // Handle various YouTube URL formats
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
        /youtube\.com\/watch\?.*v=([^&\s]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

/**
 * YouTubeModal - Modal with embedded YouTube player
 */
export function YouTubeModal({ open, onClose, url, title }) {
    const videoId = getYouTubeVideoId(url);

    if (!videoId) {
        // If we can't extract a video ID, just open the URL directly
        if (open && url) {
            window.open(url, '_blank');
            onClose();
        }
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className="sm:max-w-4xl p-0 bg-black border-[rgba(255,255,255,0.12)] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-[16px] py-[12px] border-b border-[rgba(255,255,255,0.12)]">
                    <span className="font-['Inter_Tight'] font-semibold text-[16px] text-white truncate pr-4">
                        {title || 'Video'}
                    </span>
                    <button
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
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}

export { getYouTubeVideoId };
