import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
// — shadcn/ui components —
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "@/hooks/use-media-query";
import { LessonStack } from "@/components/LessonStack";
import { AddLessonModal } from "@/components/AddLessonModal";
import { CopyPlus, Settings, ChevronLeft, ChevronRight, Share, Search, ChevronDown, ImageUp, Loader2, LogOut, X, Sparkles } from 'lucide-react';
import { CategoryTabs } from "@/components/ui/CategoryTabs";
import { SongCard } from "@/components/SongCard";
import { useAuth } from "@/context/AuthContext";
import { LoginPage } from "@/components/LoginPage";
import * as supabaseApi from "@/lib/supabaseApi";
import * as sharingApi from "@/lib/sharingApi";
import { TeacherPanel, StudentLinkPanel } from "@/components/SharingPanels";
import { InsightsTab } from "@/components/InsightsTab";

// ---------------------------
// Helpers
// ---------------------------
function formatDateOnly(val) {
  try {
    if (val === null || val === undefined || val === '') return '(no date)';
    let dt;
    if (typeof val === 'number') {
      dt = new Date(Math.round((val - 25569) * 86400 * 1000));
    } else {
      dt = new Date(val);
    }
    if (isNaN(dt)) return String(val);
    return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return String(val || '(no date)');
  }
}

const ls = {
  get(key, def) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
  },
  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }
};

const SETTINGS_KEY = "lespal_settings_v1";
const NUDGE_DISMISS_KEY = "lespal_nudge_dismissed_until";

function useSettings() {
  const [settings, setSettings] = useState(() => ls.get(SETTINGS_KEY, { geminiApiKey: "" }));
  useEffect(() => { ls.set(SETTINGS_KEY, settings); }, [settings]);
  return [settings, setSettings];
}


// ---------------------------
// SONGS LOGIC (Inline for now)
// ---------------------------
const SONG_STATUSES = ["rehearsing", "want", "studied"];

async function findArtworkUrl(artist, title) {
  if (!artist && !title) return "";
  const q = encodeURIComponent(`${artist} ${title}`.trim());
  const url = `https://itunes.apple.com/search?term=${q}&entity=song&limit=1`;
  const res = await fetch(url);
  if (!res.ok) return "";
  const data = await res.json();
  const artwork100 = data?.results?.[0]?.artworkUrl100;
  if (!artwork100) return "";
  return artwork100.replace(/100x100bb\.jpg$/, "512x512bb.jpg");
}

function AddSongModal({ open, onClose, onSubmit, initial }) {
  const isEdit = !!initial;
  const [title, setTitle] = useState(initial?.title || "");
  const [artist, setArtist] = useState(initial?.artist || "");
  const [status, setStatus] = useState(initial?.status || SONG_STATUSES[0]);
  const [tabsLink, setTabsLink] = useState(initial?.tabs_link || "");
  const [videoLink, setVideoLink] = useState(initial?.video_link || "");
  const [recordingLink, setRecordingLink] = useState(initial?.recording_link || "");
  const [artworkUrl, setArtworkUrl] = useState(initial?.artwork_url || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [fetchingCover, setFetchingCover] = useState(false);

  useEffect(() => {
    setTitle(initial?.title || "");
    setArtist(initial?.artist || "");
    setStatus(initial?.status || SONG_STATUSES[0]);
    setTabsLink(initial?.tabs_link || "");
    setVideoLink(initial?.video_link || "");
    setRecordingLink(initial?.recording_link || "");
    setArtworkUrl(initial?.artwork_url || "");
    setNotes(initial?.notes || "");
  }, [initial?.id, open]);

  function reset() {
    setTitle(""); setArtist(""); setStatus(SONG_STATUSES[0]);
    setTabsLink(""); setVideoLink(""); setRecordingLink("");
    setArtworkUrl(""); setNotes("");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.8)] backdrop-blur-md"
        onClick={() => { reset(); onClose(); }}
      />

      {/* Modal Card */}
      <div
        className="relative z-10 w-full max-w-[720px] mx-4 rounded-[24px] overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(217.06deg, #191719 21.52%, #171C1F 102.2%)',
          border: '1px solid transparent',
          backgroundImage: 'linear-gradient(217.06deg, #191719 21.52%, #171C1F 102.2%), linear-gradient(267.73deg, #3F3069 1.5%, #2E6449 99.17%)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
        }}
      >
        {/* Card Header - Static title only */}
        <div className="flex items-center px-[24px] py-[12px] border-b border-[#2c2a30]">
          <span className="text-[rgba(255,255,255,0.48)] font-medium font-['Inter_Tight'] text-[12px] leading-[20px] tracking-[0.04em] uppercase">
            {isEdit ? "Edit Song" : "Add Song"}
          </span>
        </div>

        {/* Card Content */}
        <div className="p-[36px] flex-1 flex flex-col">
          {/* Content Container */}
          <div className="flex flex-col gap-6 flex-1">
            {/* Title & Artist Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[rgba(255,255,255,0.48)] font-medium font-['Inter_Tight'] text-[12px] leading-[20px] tracking-[0.04em] uppercase">
                  Title
                </label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="px-4 py-3 rounded-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white font-['Inter'] text-[14px] leading-[1.6] focus:outline-none focus:border-[rgba(255,255,255,0.24)] transition-colors placeholder:text-[rgba(255,255,255,0.32)]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[rgba(255,255,255,0.48)] font-medium font-['Inter_Tight'] text-[12px] leading-[20px] tracking-[0.04em] uppercase">
                  Artist
                </label>
                <input
                  value={artist}
                  onChange={e => setArtist(e.target.value)}
                  className="px-4 py-3 rounded-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white font-['Inter'] text-[14px] leading-[1.6] focus:outline-none focus:border-[rgba(255,255,255,0.24)] transition-colors placeholder:text-[rgba(255,255,255,0.32)]"
                />
              </div>
            </div>

            {/* Status Select */}
            <div className="flex flex-col gap-2">
              <label className="text-[rgba(255,255,255,0.48)] font-medium font-['Inter_Tight'] text-[12px] leading-[20px] tracking-[0.04em] uppercase">
                Status
              </label>
              <div className="relative">
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full appearance-none px-4 py-3 pr-10 rounded-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white font-['Inter'] text-[14px] leading-[1.6] focus:outline-none focus:border-[rgba(255,255,255,0.24)] transition-colors cursor-pointer"
                >
                  {SONG_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.48)] pointer-events-none" />
              </div>
            </div>

            {/* Links Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[rgba(255,255,255,0.48)] font-medium font-['Inter_Tight'] text-[12px] leading-[20px] tracking-[0.04em] uppercase">
                  Tabs Link
                </label>
                <input
                  value={tabsLink}
                  onChange={e => setTabsLink(e.target.value)}
                  className="px-4 py-3 rounded-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white font-['Inter'] text-[14px] leading-[1.6] focus:outline-none focus:border-[rgba(255,255,255,0.24)] transition-colors placeholder:text-[rgba(255,255,255,0.32)]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[rgba(255,255,255,0.48)] font-medium font-['Inter_Tight'] text-[12px] leading-[20px] tracking-[0.04em] uppercase">
                  Video Link
                </label>
                <input
                  value={videoLink}
                  onChange={e => setVideoLink(e.target.value)}
                  className="px-4 py-3 rounded-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white font-['Inter'] text-[14px] leading-[1.6] focus:outline-none focus:border-[rgba(255,255,255,0.24)] transition-colors placeholder:text-[rgba(255,255,255,0.32)]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[rgba(255,255,255,0.48)] font-medium font-['Inter_Tight'] text-[12px] leading-[20px] tracking-[0.04em] uppercase">
                  Recording Link
                </label>
                <input
                  value={recordingLink}
                  onChange={e => setRecordingLink(e.target.value)}
                  className="px-4 py-3 rounded-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white font-['Inter'] text-[14px] leading-[1.6] focus:outline-none focus:border-[rgba(255,255,255,0.24)] transition-colors placeholder:text-[rgba(255,255,255,0.32)]"
                />
              </div>
            </div>

            {/* Artwork URL with icon inside */}
            <div className="flex flex-col gap-2">
              <label className="text-[rgba(255,255,255,0.48)] font-medium font-['Inter_Tight'] text-[12px] leading-[20px] tracking-[0.04em] uppercase">
                Artwork URL
              </label>
              <div className="relative">
                <input
                  value={artworkUrl}
                  onChange={e => setArtworkUrl(e.target.value)}
                  placeholder="Will try to auto-fill from Apple Music"
                  className="w-full px-4 py-3 pr-12 rounded-[8px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-white font-['Inter'] text-[14px] leading-[1.5] focus:outline-none focus:border-[rgba(255,255,255,0.24)] transition-colors placeholder:text-[rgba(255,255,255,0.32)]"
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setFetchingCover(true);
                      const url = await findArtworkUrl(artist, title);
                      if (url) setArtworkUrl(url);
                      else alert("No cover found");
                    } finally {
                      setFetchingCover(false);
                    }
                  }}
                  disabled={fetchingCover}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.48)] hover:text-[rgba(255,255,255,0.8)] transition-colors disabled:opacity-50"
                >
                  {fetchingCover ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <ImageUp size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-2">
              <label className="text-[rgba(255,255,255,0.48)] font-medium font-['Inter_Tight'] text-[12px] leading-[20px] tracking-[0.04em] uppercase">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={4}
                className="px-4 py-3 rounded-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white font-['Inter'] text-[14px] leading-[1.6] resize-none focus:outline-none focus:border-[rgba(255,255,255,0.24)] transition-colors placeholder:text-[rgba(255,255,255,0.32)]"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-4 mt-6">
            <Button variant="glass" onClick={() => { reset(); onClose(); }}>
              Cancel
            </Button>
            <Button onClick={() => {
              onSubmit({
                ...(isEdit ? { id: initial.id } : {}),
                title,
                artist,
                status,
                tabs_link: tabsLink,
                video_link: videoLink,
                recording_link: recordingLink,
                artwork_url: artworkUrl,
                notes
              });
              reset();
              onClose();
            }}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SongsTab({ items, loading, onEdit, neglectedSongs = [], nudgeVisible = false, onDismissNudge }) {
  const [q, setQ] = useState("");
  const [activeCategory, setActiveCategory] = useState("rehearsing");

  // Aggregate songs by title+artist to dedupe
  const aggregated = useMemo(() => {
    const map = new Map();
    const norm = (s) => (s || "").trim().toLowerCase();
    for (const s of items) {
      const key = `${norm(s.title)}||${norm(s.artist)}`;
      if (!map.has(key)) map.set(key, { _key: key, id: s.id || key, title: s.title || "", artist: s.artist || "", statuses: new Set(), artwork_url: s.artwork_url || "", tabs_link: s.tabs_link || "", video_link: s.video_link || "", recording_link: s.recording_link || "", notes: s.notes || "" });
      const g = map.get(key);
      if (s.status) {
        const normalizedStatus = String(s.status) === 'recorded' ? 'studied' : String(s.status);
        g.statuses.add(normalizedStatus);
      }
      if (!g.artwork_url && s.artwork_url) g.artwork_url = s.artwork_url;
      if (!g.tabs_link && s.tabs_link) g.tabs_link = s.tabs_link;
      if (!g.video_link && s.video_link) g.video_link = s.video_link;
      if (!g.recording_link && s.recording_link) g.recording_link = s.recording_link;
      if (!g.notes && s.notes) g.notes = s.notes;
    }
    return Array.from(map.values()).map(g => ({ ...g, statuses: Array.from(g.statuses) }));
  }, [items]);

  const CATEGORIES = useMemo(() => {
    const counts = aggregated.reduce((acc, s) => {
      s.statuses.forEach(st => {
        acc[st] = (acc[st] || 0) + 1;
      });
      return acc;
    }, {});

    return [
      { value: "rehearsing", label: "Rehearsing", count: counts.rehearsing || 0 },
      { value: "want", label: "Want", count: counts.want || 0 },
      { value: "studied", label: "Studied", count: counts.studied || 0 },
    ];
  }, [aggregated]);

  // Filter by search and category
  const visible = useMemo(() => {
    return aggregated.filter(s => {
      const matchesSearch = (`${s.title || ""} ${s.artist || ""}`).toLowerCase().includes(q.toLowerCase());
      const matchesCategory = s.statuses.includes(activeCategory);
      return matchesSearch && matchesCategory;
    });
  }, [aggregated, q, activeCategory]);

  return (
    <div className="mx-auto max-w-[1440px] px-[36px] pt-[60px] space-y-[24px] pb-20 md:pb-[24px]">
      {/* Header Row: Tabs and Search */}
      <div className="flex flex-wrap gap-[16px] items-center justify-between">
        {/* Category Tabs */}
        <CategoryTabs
          categories={CATEGORIES}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {/* Search Input - Glass Style */}
        <div className="relative min-w-[120px] w-[295px]">
          <input
            type="text"
            placeholder="Quick search..."
            value={q}
            onChange={e => setQ(e.target.value)}
            className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] rounded-[8px] px-[16px] py-[12px] pr-[40px] font-['Inter'] font-normal text-[14px] leading-[150%] text-[rgba(255,255,255,0.8)] placeholder-[rgba(255,255,255,0.8)] focus:outline-none focus:border-[rgba(255,255,255,0.24)]"
          />
          <Search size={16} className="absolute right-[16px] top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.48)]" />
        </div>
      </div>

      {/* Maintenance Nudge */}
      {nudgeVisible && neglectedSongs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group overflow-hidden rounded-[16px] p-[1px]"
          style={{
            background: 'linear-gradient(104.59deg, rgba(16, 185, 129, 0.12) 0.76%, rgba(16, 185, 129, 0.03) 99%)',
          }}
        >
          <div className="absolute inset-0 bg-[#161616] rounded-[16px]" />
          <div className="relative flex items-center justify-between px-6 py-4 rounded-[16px] bg-[rgba(16,185,129,0.04)] border border-[rgba(16,185,129,0.1)]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Sparkles size={20} className="text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-emerald-400 text-sm font-bold uppercase tracking-wider font-['Inter_Tight']">Refresh Needed</span>
                <p className="text-sm text-[rgba(255,255,255,0.64)]">
                  It's been a while since you played <span className="text-white font-medium">{neglectedSongs.map(s => s.title).join(', ')}</span>. Avoid forgetting them!
                </p>
              </div>
            </div>
            <button
              onClick={onDismissNudge}
              className="p-2 rounded-full hover:bg-white/5 text-[rgba(255,255,255,0.32)] hover:text-white transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && <div className="text-sm text-[rgba(255,255,255,0.48)]">Loading...</div>}

      {/* Songs Grid - 2 columns, 12px gap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[12px]">
        {visible.map(song => (
          <SongCard key={song.id} song={song} onEdit={onEdit} />
        ))}
      </div>

      {/* Empty State */}
      {!loading && visible.length === 0 && (
        <div className="text-center py-[48px] text-[rgba(255,255,255,0.48)]">
          No songs in this category
        </div>
      )}
    </div>
  );
}


// ---------------------------
// SETTINGS
// ---------------------------
function SettingsModal({ open, onClose, settings, setSettings, isTeacher, viewingStudentId, onStudentSelect }) {
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey || "");

  useEffect(() => {
    setGeminiApiKey(settings.geminiApiKey || "");
  }, [settings]);

  if (!open) return null;

  // Shared label/input classes matching AddSongModal
  const labelClass = "text-[rgba(255,255,255,0.48)] font-medium font-['Inter_Tight'] text-[12px] leading-[20px] tracking-[0.04em] uppercase";
  const inputClass = "px-4 py-3 rounded-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white font-['Inter'] text-[14px] leading-[1.6] focus:outline-none focus:border-[rgba(255,255,255,0.24)] transition-colors placeholder:text-[rgba(255,255,255,0.32)] w-full";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.8)] backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className="relative z-10 w-full max-w-[720px] mx-4 rounded-[24px] overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(217.06deg, #191719 21.52%, #171C1F 102.2%)',
          border: '1px solid transparent',
          backgroundImage: 'linear-gradient(217.06deg, #191719 21.52%, #171C1F 102.2%), linear-gradient(267.73deg, #3F3069 1.5%, #2E6449 99.17%)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
        }}
      >
        {/* Card Header */}
        <div className="flex items-center px-[24px] py-[12px] border-b border-[#2c2a30]">
          <span className="text-[rgba(255,255,255,0.48)] font-medium font-['Inter_Tight'] text-[12px] leading-[20px] tracking-[0.04em] uppercase">
            Settings
          </span>
        </div>

        {/* Card Content */}
        <div className="p-[36px] flex-1 flex flex-col max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="flex flex-col gap-10 flex-1">
            {/* Sharing Section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2">
                <Share size={16} className="text-[rgba(255,255,255,0.48)]" />
                <h3 className="text-[rgba(255,255,255,0.8)] font-semibold font-['Inter_Tight'] text-[14px] uppercase tracking-wider">Sharing</h3>
              </div>
              {isTeacher ? (
                <TeacherPanel
                  onStudentSelect={(id) => { onStudentSelect(id); onClose(); }}
                  selectedStudentId={viewingStudentId}
                />
              ) : (
                <div className="flex flex-col gap-4">
                  <div className={labelClass}>
                    Connect to Teacher
                  </div>
                  <div className="text-[rgba(255,255,255,0.64)] text-[14px]">
                    Enter your teacher's invite code to share your data with them.
                  </div>
                  <StudentLinkPanel />
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-[1px] bg-[rgba(255,255,255,0.08)] w-full" />

            {/* AI Section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-[rgba(255,255,255,0.48)]" />
                <h3 className="text-[rgba(255,255,255,0.8)] font-semibold font-['Inter_Tight'] text-[14px] uppercase tracking-wider">AI Analysis</h3>
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Gemini API Key</label>
                <input
                  value={geminiApiKey}
                  onChange={e => setGeminiApiKey(e.target.value)}
                  className={inputClass}
                  type="password"
                  placeholder="Enter your Gemini API key"
                />
                <p className="text-[11px] text-[rgba(255,255,255,0.32)]">
                  Used for semantic analysis of your lesson notes. Get one at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline hover:text-white transition-colors">Google AI Studio</a>.
                  <br />(Always replace the entire key if you're updating it).
                </p>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-4 mt-6">
            <Button variant="glass" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => { setSettings({ ...settings, geminiApiKey }); onClose(); }}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------
// APP
// ---------------------------
export default function App() {
  const { user, loading: authLoading, signOut, isTeacher } = useAuth();
  const [tab, setTab] = useState("lessons");
  const [settings, setSettings] = useSettings();
  const [showSettings, setShowSettings] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Cache - all hooks must be called unconditionally (before any early returns)
  const CACHE_KEY = 'lespal_cache_v1';
  const initialCache = useMemo(() => ls.get(CACHE_KEY, { songs: [], lessons: [], tsSongs: 0, tsLessons: 0 }), []);
  const [songs, setSongs] = useState(initialCache.songs || []);
  const [lessons, setLessons] = useState(initialCache.lessons || []);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [openLessonModal, setOpenLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [openAddSong, setOpenAddSong] = useState(false);
  const [editingSong, setEditingSong] = useState(null);

  // Nudge Dismissal State
  const [nudgeDismissedUntil, setNudgeDismissedUntil] = useState(() => {
    try {
      const v = localStorage.getItem(NUDGE_DISMISS_KEY);
      return v ? parseInt(v, 10) : 0;
    } catch { return 0; }
  });

  const handleDismissNudge = () => {
    const until = Date.now() + 7 * 24 * 60 * 60 * 1000;
    setNudgeDismissedUntil(until);
    localStorage.setItem(NUDGE_DISMISS_KEY, String(until));
  };

  const isNudgeVisible = useMemo(() => {
    return Date.now() > nudgeDismissedUntil;
  }, [nudgeDismissedUntil]);

  // Calculate Neglected Songs (not in last 20 lessons)
  const neglectedSongs = useMemo(() => {
    if (loadingLessons || loadingSongs || lessons.length === 0) return [];

    // 1. IDs of songs in last 20 lessons
    const recentLessons = lessons.slice(0, 20);
    const recentSongIds = new Set();
    recentLessons.forEach(l => {
      const ids = String(l.topics || "").split(",").filter(Boolean);
      ids.forEach(id => recentSongIds.add(String(id)));
    });

    // 2. Filter songs by status and lack of recent practice
    const candidates = songs.filter(s => {
      const normalizedStatus = String(s.status) === 'recorded' ? 'studied' : String(s.status);
      const isRepertoire = normalizedStatus === 'rehearsing';
      return isRepertoire && !recentSongIds.has(String(s.id));
    });

    // 3. (Optional) Sort by last practiced date across ALL lessons
    // For simplicity, we'll just take the top 3 from the current list (which is sorted by title)
    return candidates.slice(0, 3);
  }, [songs, lessons, loadingSongs, loadingLessons]);

  // Teacher mode: viewing a specific student's data
  const [viewingStudentId, setViewingStudentId] = useState(null);
  const [effectiveGeminiApiKey, setEffectiveGeminiApiKey] = useState("");

  const STALE_MS = 2 * 60 * 1000;

  // Resolve effective Gemini API key (Self -> Teacher -> Student)
  useEffect(() => {
    async function resolveApiKey() {
      // 1. Try local settings first (most immediate)
      if (settings.geminiApiKey) {
        setEffectiveGeminiApiKey(settings.geminiApiKey);
        return;
      }

      try {
        // 2. Try Supabase Secrets for self
        const mySecrets = await supabaseApi.getSecrets();
        if (mySecrets?.gemini_api_key) {
          setEffectiveGeminiApiKey(mySecrets.gemini_api_key);
          // Sync to local settings if missing
          if (!settings.geminiApiKey) setSettings(s => ({ ...s, geminiApiKey: mySecrets.gemini_api_key }));
          return;
        }

        // 3. If student, try teacher's secrets
        if (!isTeacher) {
          const teacherId = await supabaseApi.getTeacherOfStudent(user.id);
          if (teacherId) {
            const teacherSecrets = await supabaseApi.getSecrets(teacherId);
            if (teacherSecrets?.gemini_api_key) {
              setEffectiveGeminiApiKey(teacherSecrets.gemini_api_key);
              return;
            }
          }
        }

        // 4. If teacher viewing student, try student's secrets
        if (isTeacher && viewingStudentId) {
          const studentSecrets = await supabaseApi.getSecrets(viewingStudentId);
          if (studentSecrets?.gemini_api_key) {
            setEffectiveGeminiApiKey(studentSecrets.gemini_api_key);
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to resolve shared API key:', e);
      }

      setEffectiveGeminiApiKey("");
    }

    if (user) resolveApiKey();
  }, [user, viewingStudentId, settings.geminiApiKey, isTeacher]);

  // Sync API Key to Supabase when updated in settings
  useEffect(() => {
    if (user && settings.geminiApiKey) {
      supabaseApi.updateSecrets({ gemini_api_key: settings.geminiApiKey }).catch(console.error);
    }
  }, [settings.geminiApiKey, user]);

  // Load songs - Supabase first, fallback to Google Sheets
  const loadSongs = async (force = false) => {
    const now = Date.now();
    const cache = ls.get(CACHE_KEY, { songs: [], lessons: [], tsSongs: 0, tsLessons: 0 });
    // Skip cache check when viewing student data
    if (!viewingStudentId && !force && (now - (cache.tsSongs || 0) <= STALE_MS) && songs.length > 0) return;
    setLoadingSongs(true);
    try {
      // If viewing a student's data, use student-specific API
      const s = viewingStudentId
        ? await sharingApi.listStudentSongs(viewingStudentId)
        : await supabaseApi.listSongs();
      s.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      setSongs(s);
      // Only cache own data, not student data
      if (!viewingStudentId) {
        ls.set(CACHE_KEY, { ...cache, songs: s, tsSongs: now });
      }
    } catch (supabaseError) {
      console.warn('Supabase failed:', supabaseError);
    } finally { setLoadingSongs(false); }
  };

  // Load lessons - Supabase first, fallback to Google Sheets
  const loadLessons = async (force = false) => {
    const now = Date.now();
    const cache = ls.get(CACHE_KEY, { songs: [], lessons: [], tsSongs: 0, tsLessons: 0 });
    // Skip cache check when viewing student data
    if (!viewingStudentId && !force && (now - (cache.tsLessons || 0) <= STALE_MS) && lessons.length > 0) return;
    setLoadingLessons(true);
    try {
      // If viewing a student's data, use student-specific API
      const l = viewingStudentId
        ? await sharingApi.listStudentLessons(viewingStudentId)
        : await supabaseApi.listLessons();
      setLessons(l);
      // Only cache own data, not student data
      if (!viewingStudentId) {
        ls.set(CACHE_KEY, { ...cache, lessons: l, tsLessons: now });
      }
    } catch (supabaseError) {
      console.warn('Supabase failed:', supabaseError);
    } finally { setLoadingLessons(false); }
  };

  // Enriched Lessons (mapping song IDs to objects)
  const enrichedLessons = useMemo(() => {
    const songById = Object.fromEntries(songs.map(s => [String(s.id), s]));
    return lessons.map(l => {
      const ids = String(l.topics || "").split(",").filter(Boolean);
      const lessonSongs = ids.map(id => songById[id] || { title: `Unknown (${id})`, artist: 'Unknown' });
      return { ...l, songs: lessonSongs };
    });
  }, [lessons, songs]);

  // Load data when user or viewing student changes
  useEffect(() => {
    if (user) {
      loadSongs(true);
      loadLessons(true);
    }
  }, [user, viewingStudentId]);

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#161616] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-white" />
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  const handleUpsertSong = async (payload) => {
    try {
      if (payload?.id) {
        await supabaseApi.updateSong(payload.id, payload);
      } else {
        await supabaseApi.createSong(payload, viewingStudentId);
      }
      await loadSongs(true);
    } catch (e) { alert(e.message); }
  };

  const handleUpsertLesson = async (payload) => {
    try {
      if (payload?.id) {
        await supabaseApi.updateLesson(payload.id, payload);
      } else {
        await supabaseApi.createLesson(payload, viewingStudentId);
      }
      await loadLessons(true);
    } catch (e) { alert(e.message); }
  };

  const handleDeleteLesson = async (id) => {
    try {
      await supabaseApi.deleteLesson(id);
      await loadLessons(true);
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground bg-[#161616] overflow-hidden relative font-sans">
      {/* Background Blurs */}
      {/* Background Blurs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Left Blur (Cyan/Teal) - Higher and more to the left (half visible) */}
        <div className="absolute top-[6%] -left-[490px] w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(0,174,239,0.5)_0%,rgba(0,174,239,0)_70%)] blur-[210px] mix-blend-screen opacity-100" />
        {/* Right Blur (Purple) - Higher and more to the right (half visible) */}
        <div className="absolute top-[30%] -right-[490px] w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(102,45,145,0.5)_0%,rgba(102,45,145,0)_70%)] blur-[210px] mix-blend-screen opacity-100" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-transparent">
        <div className={`mx-auto max-w-[1440px] px-[36px] py-[24px] flex items-center justify-between h-[92px] transition-all duration-300 ${isMobile ? 'px-[20px] h-auto flex-wrap gap-4' : ''}`}>
          {/* Logo */}
          <div className="flex items-center shrink-0">
            <img src={`${import.meta.env.BASE_URL}logo-dark.svg`} alt="Lespal" className="w-[90px] h-[44px]" />
          </div>

          {/* Desktop Tabs */}
          {!isMobile && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full backdrop-blur-md">
              <div
                className="absolute inset-0 rounded-full p-[1px] pointer-events-none"
                style={{
                  background: 'linear-gradient(104.59deg, rgba(255, 255, 255, 0.12) 0.76%, rgba(255, 255, 255, 0.0307) 32.78%, rgba(255, 255, 255, 0.0882) 69.11%, rgba(255, 255, 255, 0.0084) 99%)',
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude',
                  WebkitMaskComposite: 'xor'
                }}
              />
              <div className="flex gap-[20px] px-[24px] py-[12px] rounded-full bg-transparent relative z-10">
                <button onClick={() => setTab('lessons')} className={`text-[16px] font-semibold font-['Inter_Tight'] leading-[20px] transition-all ${tab === 'lessons' ? 'text-white' : 'text-[rgba(255,255,255,0.64)] hover:text-white/80'}`}>Lessons</button>
                <button onClick={() => setTab('songs')} className={`text-[16px] font-semibold font-['Inter_Tight'] leading-[20px] transition-all ${tab === 'songs' ? 'text-white' : 'text-[rgba(255,255,255,0.64)] hover:text-white/80'}`}>Songs</button>
                <button onClick={() => setTab('insights')} className={`text-[16px] font-semibold font-['Inter_Tight'] leading-[20px] transition-all ${tab === 'insights' ? 'text-white' : 'text-[rgba(255,255,255,0.64)] hover:text-white/80'}`}>Insights</button>
              </div>
            </div>
          )}

          {/* Actions (Icon Only Group) */}
          <div className="flex items-center gap-[12px]">
            <Button
              variant="default" // Primary "Add"
              size="icon"
              onClick={() => {
                if (tab === 'lessons') { setEditingLesson(null); setOpenLessonModal(true); }
                else { setEditingSong(null); setOpenAddSong(true); }
              }}
              className="w-[44px] h-[44px] p-[10px]"
            >
              <CopyPlus size={20} strokeWidth={2} />
            </Button>

            {/* Secondary "Settings" */}
            <Button
              variant="glass"
              size="icon"
              onClick={() => setShowSettings(true)}
              className="w-[44px] h-[44px] hover:text-white"
            >
              <Settings size={20} strokeWidth={1.5} />
            </Button>

            {/* Logout */}
            <Button
              variant="glass"
              size="icon"
              onClick={signOut}
              className="w-[44px] h-[44px] hover:text-white"
              title="Sign out"
            >
              <LogOut size={20} strokeWidth={1.5} />
            </Button>
          </div>

          {/* Mobile Tabs */}
          {isMobile && (
            <div className="w-full relative rounded-full backdrop-blur-md">
              {/* Gradient Border - same as desktop */}
              <div
                className="absolute inset-0 rounded-full p-[1px] pointer-events-none"
                style={{
                  background: 'linear-gradient(104.59deg, rgba(255, 255, 255, 0.12) 0.76%, rgba(255, 255, 255, 0.0307) 32.78%, rgba(255, 255, 255, 0.0882) 69.11%, rgba(255, 255, 255, 0.0084) 99%)',
                  mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  maskComposite: 'exclude',
                  WebkitMaskComposite: 'xor'
                }}
              />
              <div className="flex items-center justify-between px-[48px] py-[16px] rounded-full bg-transparent relative z-10">
                <button onClick={() => setTab('lessons')} className={`text-[18px] font-semibold font-['Inter_Tight'] leading-[1.5] transition-all ${tab === 'lessons' ? 'text-white' : 'text-[rgba(255,255,255,0.64)]'}`}>Lessons</button>
                <button onClick={() => setTab('songs')} className={`text-[18px] font-semibold font-['Inter_Tight'] leading-[1.5] transition-all ${tab === 'songs' ? 'text-white' : 'text-[rgba(255,255,255,0.64)]'}`}>Songs</button>
                <button onClick={() => setTab('insights')} className={`text-[18px] font-semibold font-['Inter_Tight'] leading-[1.5] transition-all ${tab === 'insights' ? 'text-white' : 'text-[rgba(255,255,255,0.64)]'}`}>Insights</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 z-10 relative">
        {tab === 'lessons' && (
          <div className={`w-full flex justify-center ${isMobile ? 'mt-[24px] px-[16px]' : 'mt-[120px] px-[36px]'}`}>
            {/* Desktop needs room for nav buttons, Mobile uses full width minus internal padding */}
            <LessonStack lessons={enrichedLessons} isMobile={isMobile} onEdit={(lesson) => { setEditingLesson(lesson); setOpenLessonModal(true); }} />
          </div>
        )}
        {tab === 'songs' && (
          <SongsTab
            items={songs}
            loading={loadingSongs}
            onEdit={(s) => { setEditingSong(s); setOpenAddSong(true); }}
            neglectedSongs={neglectedSongs}
            nudgeVisible={isNudgeVisible}
            onDismissNudge={handleDismissNudge}
          />
        )}

        {tab === 'insights' && (
          <InsightsTab songs={songs} lessons={enrichedLessons} geminiApiKey={effectiveGeminiApiKey} />
        )}
      </div>

      {/* Modals */}
      <AddLessonModal
        open={openLessonModal}
        onClose={() => setOpenLessonModal(false)}
        onSubmit={handleUpsertLesson}
        onDelete={handleDeleteLesson}
        songs={songs}
        initial={editingLesson}
        lastLesson={lessons[0]} // Pass latest lesson for calculating remaining
      />
      <AddSongModal
        open={openAddSong}
        onClose={() => setOpenAddSong(false)}
        onSubmit={handleUpsertSong}
        initial={editingSong}
      />
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        setSettings={setSettings}
        isTeacher={isTeacher}
        viewingStudentId={viewingStudentId}
        onStudentSelect={setViewingStudentId}
      />
    </div>
  );
}
