import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Calendar, SquarePen } from "lucide-react";
import { cn } from "./ui/utils";
import { Button } from "./ui/button";

// Song Pill component matching design
function SongPill({ song, onRemove }) {
    return (
        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[rgba(255,255,255,0.08)] text-[#6ee7b7] text-[11px] font-medium font-['Inter_Tight'] tracking-[0.44px] leading-[20px]">
            <span>{song.title} — {song.artist}</span>
            <button onClick={onRemove} className="ml-1 hover:opacity-70 transition-opacity">×</button>
        </div>
    );
}

// Songs dropdown selector
function SongsSelector({ songs, selectedIds, onToggle, isOpen, setIsOpen }) {
    const [query, setQuery] = useState("");

    const filtered = songs.filter(s =>
        (s.title + s.artist).toLowerCase().includes(query.toLowerCase())
    );

    const selectedSongs = songs.filter(s => selectedIds.includes(String(s.id)));

    return (
        <div className="relative">
            {/* Input Field Container */}
            <div
                className="min-h-[52px] px-4 py-3 rounded-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-between cursor-pointer hover:border-[rgba(255,255,255,0.16)] transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex flex-wrap gap-2 flex-1">
                    {selectedSongs.length === 0 && (
                        <span className="text-[rgba(255,255,255,0.32)] font-['Inter'] text-[14px]">Select songs to add to this lesson...</span>
                    )}
                    {selectedSongs.map(s => (
                        <SongPill
                            key={s.id}
                            song={s}
                            onRemove={(e) => { e.stopPropagation(); onToggle(String(s.id)); }}
                        />
                    ))}
                </div>
                <ChevronDown size={20} className={`text-[rgba(255,255,255,0.48)] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 w-full z-50 mt-2 bg-[#1a1820] border border-[rgba(255,255,255,0.1)] rounded-[12px] shadow-2xl overflow-hidden">
                        <input
                            autoFocus
                            placeholder="Search songs..."
                            className="w-full bg-transparent px-4 py-3 text-sm text-white border-b border-[rgba(255,255,255,0.1)] focus:outline-none font-['Inter']"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onClick={e => e.stopPropagation()}
                        />
                        <div className="max-h-60 overflow-y-auto p-2">
                            {filtered.map(s => {
                                const isSelected = selectedIds.includes(String(s.id));
                                return (
                                    <div
                                        key={s.id}
                                        className={cn(
                                            "px-3 py-2 rounded-[8px] text-sm cursor-pointer flex items-center justify-between font-['Inter']",
                                            isSelected ? "bg-[rgba(110,231,183,0.1)] text-[#6ee7b7]" : "text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,255,255,0.05)]"
                                        )}
                                        onClick={() => onToggle(String(s.id))}
                                    >
                                        <span>{s.title} — <span className="opacity-50">{s.artist}</span></span>
                                        {isSelected && <span>✓</span>}
                                    </div>
                                );
                            })}
                            {filtered.length === 0 && <div className="p-3 text-center text-[rgba(255,255,255,0.3)] text-xs">No songs found</div>}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export function AddLessonModal({ open, onClose, onSubmit, onDelete, songs, initial, lastLesson }) {
    const isEdit = !!initial;
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [notes, setNotes] = useState("");
    const [selectedSongIds, setSelectedSongIds] = useState([]);
    const dateInputRef = useRef(null);
    const [songsDropdownOpen, setSongsDropdownOpen] = useState(false);
    const [isEditingCounter, setIsEditingCounter] = useState(false);
    const counterInputRef = useRef(null);
    const DRAFT_KEY_NEW = "lespal_lesson_draft_new";
    const getDraftKey = (lessonId) => lessonId ? `lespal_lesson_draft_${lessonId}` : DRAFT_KEY_NEW;

    // Save to localStorage whenever notes or songs change (for both new and editing)
    useEffect(() => {
        if (open && (notes || selectedSongIds.length > 0)) {
            const key = getDraftKey(initial?.id);
            localStorage.setItem(key, JSON.stringify({ notes, selectedSongIds }));
        }
    }, [notes, selectedSongIds, open, initial]);

    useEffect(() => {
        if (isEditingCounter && counterInputRef.current) {
            counterInputRef.current.focus();
        }
    }, [isEditingCounter]);

    // Auto-calc remaining
    const [calculatedRemaining, setCalculatedRemaining] = useState(
        initial?.remaining_lessons ||
        (lastLesson?.remaining_lessons ? Math.max(0, parseInt(lastLesson.remaining_lessons) - 1) : 0)
    );

    // Initialize form state when modal opens - handles both editing and new lesson with draft recovery
    useEffect(() => {
        if (open) {
            const draftKey = getDraftKey(initial?.id);
            let draftNotes = "";
            let draftSongIds = [];

            // Try to load draft from localStorage
            try {
                const saved = localStorage.getItem(draftKey);
                if (saved) {
                    const draft = JSON.parse(saved);
                    draftNotes = draft.notes || "";
                    draftSongIds = draft.selectedSongIds || [];
                }
            } catch (e) {
                console.warn("Failed to load draft:", e);
            }

            if (initial) {
                // Editing an existing lesson: use draft if available, otherwise use initial data
                setDate(initial.date ? new Date(initial.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
                setNotes(draftNotes || initial.notes || "");
                setSelectedSongIds(draftSongIds.length > 0 ? draftSongIds : (initial.topics ? String(initial.topics).split(',').filter(Boolean) : []));
                setCalculatedRemaining(initial.remaining_lessons);
            } else {
                // New lesson: use draft if available
                setDate(new Date().toISOString().slice(0, 10));
                setNotes(draftNotes);
                setSelectedSongIds(draftSongIds);
                setCalculatedRemaining(
                    lastLesson?.remaining_lessons ? Math.max(0, parseInt(lastLesson.remaining_lessons) - 1) : 0
                );
            }
            setSongsDropdownOpen(false);
        }
    }, [open, initial, lastLesson]);

    const handleSubmit = () => {
        const draftKey = getDraftKey(initial?.id);
        onSubmit({
            ...(isEdit ? { id: initial.id } : {}),
            date,
            notes,
            topics: selectedSongIds.join(','),
            remaining_lessons: calculatedRemaining
        });
        onClose();
        localStorage.removeItem(draftKey);
    };

    // Format date for display matching lesson card: "10 Dec 2025" uppercase
    const displayDate = new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-[rgba(0,0,0,0.8)] backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div
                className="relative z-10 w-full max-w-[1080px] mx-4 rounded-[24px] overflow-hidden flex flex-col"
                style={{
                    background: 'linear-gradient(217.06deg, #191719 21.52%, #171C1F 102.2%)',
                    border: '1px solid transparent',
                    backgroundImage: 'linear-gradient(217.06deg, #191719 21.52%, #171C1F 102.2%), linear-gradient(267.73deg, #2C2A30 1.5%, #2E3437 99.17%)',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    boxShadow: '0px 2px 0px 2px rgba(17, 19, 23, 0.64)'
                }}
            >
                {/* Card Header */}
                <div className="flex items-center justify-between px-[24px] py-[12px] border-b border-[#2c2a30]">
                    {/* Left: Date with Calendar - clicking calendar opens date picker */}
                    <div className="flex items-center gap-2">
                        <span className="text-[rgba(255,255,255,0.48)] font-medium font-['Inter_Tight'] text-[12px] leading-[20px] tracking-[0.04em] uppercase">
                            {displayDate}
                        </span>
                        <button
                            onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.click()}
                            className="p-1 hover:bg-[rgba(255,255,255,0.1)] rounded transition-colors -translate-y-[1px]"
                        >
                            <Calendar size={16} className="text-[#FFCC00]" />
                        </button>
                        {/* Hidden date input */}
                        <input
                            ref={dateInputRef}
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="sr-only"
                        />
                    </div>

                    {/* Right: Remaining counter */}
                    {/* Right: Editable Remaining counter */}
                    <div className="flex items-center gap-2 text-[12px] font-medium font-['Inter_Tight'] text-[rgba(255,255,255,0.48)] leading-[20px] tracking-[0.04em] uppercase">
                        {!isEditingCounter ? (
                            <>
                                <button
                                    onClick={() => setIsEditingCounter(true)}
                                    className="text-[#FFCC00] hover:bg-[rgba(255,255,255,0.1)] p-1 rounded transition-colors"
                                >
                                    <SquarePen size={14} />
                                </button>
                                <span>
                                    <span className="font-bold text-[rgba(255,255,255,0.72)]">{calculatedRemaining}</span> lessons remaining
                                </span>
                            </>
                        ) : (
                            <div className="flex items-center gap-1">
                                <input
                                    ref={counterInputRef}
                                    type="number"
                                    value={calculatedRemaining}
                                    onChange={(e) => setCalculatedRemaining(parseInt(e.target.value) || 0)}
                                    onBlur={() => setIsEditingCounter(false)}
                                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingCounter(false)}
                                    className="w-[48px] bg-transparent border-b border-[#FFCC00] text-center font-bold text-[rgba(255,255,255,0.72)] focus:outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span>lessons remaining</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Card Content */}
                <div className="p-[36px] flex-1 flex flex-col">
                    {/* Content Container */}
                    <div className="flex flex-col gap-6 flex-1">
                        {/* Songs Input */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[rgba(255,255,255,0.48)] font-medium font-['Inter_Tight'] text-[12px] leading-[20px] tracking-[0.04em] uppercase">
                                Songs Rehearsed
                            </label>
                            <SongsSelector
                                songs={songs}
                                selectedIds={selectedSongIds}
                                onToggle={(id) => {
                                    setSelectedSongIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                                }}
                                isOpen={songsDropdownOpen}
                                setIsOpen={setSongsDropdownOpen}
                            />
                        </div>

                        {/* Notes Input */}
                        <div className="flex flex-col gap-2 flex-1">
                            <label className="text-[rgba(255,255,255,0.48)] font-medium font-['Inter_Tight'] text-[12px] leading-[20px] tracking-[0.04em] uppercase">
                                Notes
                            </label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="What did we work on today?"
                                className="flex-1 min-h-[200px] px-4 py-3 rounded-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white font-['Inter'] text-[14px] leading-[1.6] resize-none focus:outline-none focus:border-[rgba(255,255,255,0.24)] transition-colors placeholder:text-[rgba(255,255,255,0.32)]"
                            />
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex items-center justify-between gap-4 mt-6">
                        {/* Delete Button - Left Aligned, only when editing */}
                        {isEdit && onDelete ? (
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this lesson?')) {
                                        const draftKey = getDraftKey(initial?.id);
                                        localStorage.removeItem(draftKey);
                                        onDelete(initial.id);
                                        onClose();
                                    }
                                }}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                                Delete
                            </Button>
                        ) : <div />}

                        {/* Cancel/Save - Right Aligned */}
                        <div className="flex items-center gap-4">
                            <Button variant="glass" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit}>
                                {isEdit ? 'Save Changes' : 'Save'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
