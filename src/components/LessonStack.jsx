import React, { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { DesktopLessonCard } from "./DesktopLessonCard";
import { MobileLessonCard } from "./MobileLessonCard";
import { Button } from "./ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function LessonStack({ lessons, isMobile, onEdit }) {
    const [index, setIndex] = useState(0);

    // If empty
    if (!lessons || lessons.length === 0) {
        return <div className="text-center text-white/50 py-20">No lessons found. Add one!</div>;
    }

    // Ensure index is valid
    const safeIndex = Math.min(Math.max(0, index), lessons.length - 1);

    // Cycle logic: Next = older (Index + 1), Prev = newer (Index - 1)
    const handleNext = () => {
        if (safeIndex < lessons.length - 1) setIndex(safeIndex + 1);
    };

    const handlePrev = () => {
        if (safeIndex > 0) setIndex(safeIndex - 1);
    };

    // Stacking Configuration
    const VISIBLE_COUNT = 3;

    // Variants for stack - different for mobile vs desktop
    // Desktop: Front card: scale 1, y 0, no rotation
    //          Back 1: no scale, y 1px, rotate 2deg, no box shadow
    //          Back 2: no scale, y 13px, rotate -2deg, no box shadow
    // Mobile:  Back 1: scale 0.9, y -7px, rotate 2deg, no box shadow
    //          Back 2: scale 0.9, y -8px, rotate -2deg, no box shadow
    const variants = {
        front: { zIndex: 3, opacity: 1, scale: 1, y: 0, rotate: 0 },
        back1: { zIndex: 2, opacity: 1, scale: isMobile ? 0.9 : 1, y: isMobile ? -7 : 1, rotate: 2, boxShadow: 'none' },
        back2: { zIndex: 1, opacity: 1, scale: isMobile ? 0.9 : 1, y: isMobile ? -8 : 13, rotate: -2, boxShadow: 'none' },
        hidden: { zIndex: 0, opacity: 0, scale: isMobile ? 0.85 : 1, y: isMobile ? -10 : 30, rotate: 0 },
        // Exit: Swipe out to RIGHT. Rotate slightly.
        exit: { zIndex: 4, x: 500, opacity: 0, rotate: 5, transition: { duration: 0.2 } }
    };

    // Mobile Swipe Logic
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-5, 5]); // Subtle rotation
    const opacity = useTransform(x, [-150, 0, 150], [0.5, 1, 0.5]);

    const onDragEnd = (e, { offset, velocity }) => {
        const swipeConfidenceThreshold = 100; // Lower threshold slightly for better feel
        const swipePower = Math.abs(offset.x) * velocity.x;

        // Determine direction
        // Swipe Right (Positive x) -> Prev (Newer)
        // Swipe Left (Negative x) -> Next (Older)

        if (offset.x < -100 || (offset.x < 0 && swipePower < -swipeConfidenceThreshold)) {
            handleNext();
        } else if (offset.x > 100 || (offset.x > 0 && swipePower > swipeConfidenceThreshold)) {
            handlePrev();
        }
    };

    // Reusable Arrow Button component for cleaner code
    const NavArrowButton = ({ direction, onClick, disabled }) => (
        <div
            className={`relative flex-shrink-0 w-[88px] h-[88px] rounded-full flex items-center justify-center group transition-opacity ${disabled ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}
        >
            {/* Normal State: Gradient Border */}
            <div
                className="absolute inset-0 rounded-full p-[2px] pointer-events-none transition-opacity duration-300 group-hover:opacity-0"
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
                className="absolute inset-0 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 border-[2px] border-[#59567C]"
                style={{
                    background: 'linear-gradient(68.35deg, rgba(188, 183, 255, 0.16) 3.81%, rgba(47, 41, 112, 0.08) 113.08%)'
                }}
            />
            <Button
                variant="ghost"
                onClick={onClick}
                disabled={disabled}
                className="w-full h-full p-[24px] bg-transparent border-none text-white hover:text-white hover:bg-transparent transition-colors rounded-full relative z-10"
            >
                {direction === 'left' ? <ArrowLeft size={40} strokeWidth={2} /> : <ArrowRight size={40} strokeWidth={2} />}
            </Button>
        </div>
    );

    return (
        <div className={`w-full flex justify-center ${!isMobile ? 'items-center gap-[56px]' : 'items-start'}`}>
            {/* Left Arrow Button (Older/Next Index) - Desktop only */}
            {!isMobile && (
                <NavArrowButton
                    direction="left"
                    onClick={handleNext}
                    disabled={safeIndex === lessons.length - 1}
                />
            )}

            {/* Card Stack Container - Responsive width, height from content */}
            <div className={`relative ${isMobile ? "w-full h-[60vh] perspective-1000" : "flex-1 max-w-[1080px] min-w-[327px] min-h-[480px]"}`}>
                <AnimatePresence initial={false} mode="popLayout">
                    {/* Render stack. We map visible slice + 1buffer */}
                    {lessons.slice(safeIndex, safeIndex + VISIBLE_COUNT).map((lesson, i) => {
                        const isFront = i === 0;
                        // globalIndex is safeIndex + i. 
                        // But wait, "remaining lessons" should be "count of NEWER lessons".
                        // If I am at index 5, there are 5 newer lessons (0-4).
                        // So previousCount = globalIndex.
                        const globalIndex = safeIndex + i;

                        return (
                            <motion.div
                                key={lesson.id || globalIndex} // Use ID if possible
                                className="absolute top-0 left-0 w-full"
                                style={{
                                    transformOrigin: "center top",
                                    ...(isMobile && isFront ? { x, rotate, opacity } : {})
                                }}
                                initial={isFront ? "hidden" : `back${i}`} // If appearing as front, fade in? Or just be.
                                animate={isFront ? "front" : i === 1 ? "back1" : "back2"}
                                exit="exit"
                                variants={variants}
                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                drag={isMobile && isFront ? "x" : false}
                                dragConstraints={{ left: -1000, right: 1000 }} // Allow full dragging
                                dragElastic={0.05} // Looser feel
                                onDragEnd={onDragEnd}
                                whileTap={isMobile && isFront ? { cursor: "grabbing" } : {}}
                            >
                                {isMobile ? (
                                    <MobileLessonCard lesson={lesson} previousCount={globalIndex} />
                                ) : (
                                    <DesktopLessonCard lesson={lesson} previousCount={globalIndex} showShadow={isFront} onEdit={isFront ? onEdit : undefined} />
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Right Arrow Button (Newer/Prev Index) - Desktop only */}
            {!isMobile && (
                <NavArrowButton
                    direction="right"
                    onClick={handlePrev}
                    disabled={safeIndex === 0}
                />
            )}

            {isMobile && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/30 text-xs tracking-wider uppercase font-medium">Swipe to navigate</div>}
        </div>
    );
}
