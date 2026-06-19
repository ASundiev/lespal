import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Calendar, Loader2, SquarePen } from "lucide-react";
import { cn } from "./ui/utils";
import { Button } from "./ui/button";
import { formatLessonDate, todayDateInput } from "@/lib/dateUtils";

// Song Pill component matching design
function SongPill({ song, onRemove }) {
    return (
        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[rgba(255,255,255,0.08)] text-[#6ee7b7] text-[11px] font-medium font-['Inter_Tight'] tracking-[0.44px] leading-[20px]">
            <span>{song.title} — {song.artist}</span>
            <button type="button" aria-label={`Remove ${song.title}`} onClick={onRemove} className="ml-1 hover:opacity-70 transition-opacity">×</button>
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
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
                aria-label="Select songs rehearsed"
                className="min-h-[52px] px-4 py-3 rounded-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-between cursor-pointer hover:border-[rgba(255,255,255,0.16)] transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') setIsOpen(!isOpen);
                }}
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
    const [date, setDate] = useState(todayDateInput);
    const [notes, setNotes] = useState("");
    const [selectedSongIds, setSelectedSongIds] = useState([]);
    const dateInputRef = useRef(null);
    const [songsDropdownOpen, setSongsDropdownOpen] = useState(false);
    const [isEditingCounter, setIsEditingCounter] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const counterInputRef = useRef(null);
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

    // Initialize form state from the confirmed database row whenever it opens.
    useEffect(() => {
        if (open) {
            if (initial) {
                setDate(initial.date || todayDateInput());
                setNotes(initial.notes || "");
                setSelectedSongIds(initial.topics ? String(initial.topics).split(',').filter(Boolean) : []);
                setCalculatedRemaining(initial.remaining_lessons);
            } else {
                setDate(todayDateInput());
                setNotes("");
                setSelectedSongIds([]);
                setCalculatedRemaining(
                    lastLesson?.remaining_lessons ? Math.max(0, parseInt(lastLesson.remaining_lessons) - 1) : 0
                );
            }
            setSongsDropdownOpen(false);
            setSaveError("");
        }
    }, [open, initial, lastLesson]);

    const handleSubmit = async () => {
        setSaving(true);
        setSaveError("");
        try {
            await onSubmit({
                ...(isEdit ? { id: initial.id } : {}),
                ...(isEdit ? { expected_updated_at: initial.updated_at } : {}),
                date,
                notes,
                topics: selectedSongIds.join(','),
                remaining_lessons: calculatedRemaining
            });
            onClose();
        } catch (error) {
            setSaveError(error?.message || 'Could not save this lesson');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this lesson?')) return;
        setSaving(true);
        setSaveError("");
        try {
            await onDelete(initial.id);
            onClose();
        } catch (error) {
            setSaveError(error?.message || 'Could not delete this lesson');
        } finally {
            setSaving(false);
        }
    };

    // Format date for display matching lesson card: "10 Dec 2025" uppercase
    const displayDate = formatLessonDate(date).toUpperCase();

    if (!open) return null;

    return (
        <div role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit lesson' : 'Add lesson'} className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-[rgba(0,0,0,0.8)] backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div
                className="relative z-10 flex max-h-[100dvh] w-full max-w-[1080px] flex-col overflow-hidden rounded-t-[24px] sm:max-h-[calc(100dvh-2rem)] sm:rounded-[24px]"
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
                <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 border-b border-[#2c2a30] sm:px-[24px]">
                    {/* Left: Date with Calendar - clicking calendar opens date picker */}
                    <div className="flex items-center gap-2">
                        <span className="text-[rgba(255,255,255,0.48)] font-medium font-['Inter_Tight'] text-[12px] leading-[20px] tracking-[0.04em] uppercase">
                            {displayDate}
                        </span>
                        <button
                            type="button"
                            aria-label="Choose lesson date"
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
                                    type="button"
                                    aria-label="Edit lessons remaining"
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
                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-[36px] flex flex-col">
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
                                className="flex-1 min-h-[160px] sm:min-h-[200px] px-4 py-3 rounded-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white font-['Inter'] text-[14px] leading-[1.6] resize-none focus:outline-none focus:border-[rgba(255,255,255,0.24)] transition-colors placeholder:text-[rgba(255,255,255,0.32)]"
                            />
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    {saveError && <p role="alert" className="mt-4 text-sm text-red-300">{saveError}</p>}
                    <div className="flex items-center justify-between gap-3 mt-6">
                        {/* Delete Button - Left Aligned, only when editing */}
                        {isEdit && onDelete ? (
                            <Button
                                variant="ghost"
                                onClick={handleDelete}
                                disabled={saving}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                                Delete
                            </Button>
                        ) : <div />}

                        {/* Cancel/Save - Right Aligned */}
                        <div className="flex items-center gap-4">
                            <Button variant="glass" onClick={onClose} disabled={saving}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit} disabled={saving}>
                                {saving && <Loader2 size={18} className="animate-spin" />}
                                {saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Save')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
