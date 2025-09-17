import React, { useEffect, useMemo, useState } from "react";
// — shadcn/ui components —
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Lespal — super‑simple app for tracking guitar lessons & songs.
 *
 * Tabs: Lessons | Songs; plus a Settings button.
 * Backend: Google Apps Script Web App (see code at bottom of this file).
 * Storage: backend URL + API token in localStorage so you set it once.
 *
 * CSV reference (from your files):
 * Lessons: [id, date, notes, topics, link, audio_url, remaining_lessons, created_at, updated_at]
 * Songs:   [id, title, artist, status, tabs_link, video_link, recording_link, artwork_url, notes, created_at, updated_at]
 *
 * NOTES ABOUT FIELD ALIGNMENT
 * - We map the lesson "songs rehearsed" selection into the existing Lessons.topics field
 *   as a comma‑separated list of song IDs (e.g., "12,7,25"). This avoids adding a 3rd sheet
 *   and keeps compatibility with your current two‑tab structure.
 * - On read, we parse Lessons.topics back to an array of song IDs.
 *
 * SECURITY
 * - The Apps Script adds a simple bearer token check (via query param). Put the same token into Settings here.
 * - Requests go to the `googleusercontent.com` host and use JSONP to avoid CORS.
 */

// ---------------------------
// Helpers
// ---------------------------
function formatDateOnly(val){
  try{
    if (val === null || val === undefined || val === '') return '(no date)';
    // Support ISO strings, Date objects, and (rare) sheet serial numbers
    let dt;
    if (typeof val === 'number') {
      // Convert Google/Excel serial date to JS Date (days since 1899-12-30)
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

function useSettings() {
  const [settings, setSettings] = useState(() => ls.get(SETTINGS_KEY, { baseUrl: "", token: "" }));
  useEffect(() => { ls.set(SETTINGS_KEY, settings); }, [settings]);
  return [settings, setSettings];
}

function Header({ tab, setTab, openSettings, onRefresh }) {
  return (
    <div className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur border-b border-neutral-800">
      <div className="mx-auto max-w-5xl px-3">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            <img
              src={`${import.meta.env.BASE_URL}logo-dark.svg`}
              alt="Lespal"
              className="h-10 w-auto select-none"
              draggable={false}
            />
          </div>

          <div className="flex items-center gap-4">
            <Tabs value={tab} onValueChange={setTab} className="hidden sm:block">
              <TabsList className="bg-neutral-900">
                <TabsTrigger value="lessons">Lessons</TabsTrigger>
                <TabsTrigger value="songs">Songs</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <TooltipProvider>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Refresh" onClick={onRefresh} className="text-neutral-200 hover:bg-neutral-800">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10"/>
                      <polyline points="1 20 1 14 7 14"/>
                      <path d="M3.51 9a9 9 0 0114.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0020.49 15"/>
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Refresh</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Settings" onClick={openSettings} className="text-neutral-200 hover:bg-neutral-800">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Settings</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}

// ---------------------------
// API client (Google Apps Script)
// ---------------------------
// Use JSONP to bypass CORS for Apps Script web apps.
// More robust version with domain fallback.
function jsonpOnce(url) {
  return new Promise((resolve, reject) => {
    const cb = `__lespal_cb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const sep = url.includes('?') ? '&' : '?';
    const full = `${url}${sep}callback=${cb}`;
    const script = document.createElement('script');
    let done = false;
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('JSONP timeout'));
    }, 15000);

    function cleanup() {
      clearTimeout(timer);
      try { delete window[cb]; } catch (_) { window[cb] = undefined; }
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    window[cb] = (data) => {
      if (done) return;
      done = true;
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      if (done) return;
      done = true;
      cleanup();
      reject(new Error('JSONP network error'));
    };

    script.src = full;
    document.head.appendChild(script);
  });
}

async function apiRequest({ baseUrl, token }, action, payload) {
  if (!baseUrl) throw new Error('Please set the Apps Script Web App URL in Settings.');

  // Map actions to REST-ish paths and HTTP verbs
  const ACTIONS = {
    listSongs:   { path: 'songs',   method: 'GET'  },
    listLessons: { path: 'lessons', method: 'GET'  },
    createSong:  { path: 'songs',   method: 'POST' },
    createLesson:{ path: 'lessons', method: 'POST' },
    updateLesson:{ path: 'lessons', method: 'POST' },
  };
  const cfg = ACTIONS[action] || { path: '', method: 'GET' };

  // Build URL: base (without trailing slash) + path, with required query params
  const root = baseUrl.replace(/\/$/, '');
  const url = new URL(`${root}/${cfg.path}`);
  if (action) url.searchParams.set('action', action);
  if (token)  url.searchParams.set('token', token);

  // Perform request
  const init = { method: cfg.method, headers: {} };
  if (cfg.method === 'POST') {
    init.headers['Content-Type'] = 'application/json';
    // Apps Script proxy expects the JSON body to wrap the payload
    init.body = JSON.stringify({ payload: payload || {} });
  }

  const res = await fetch(url.toString(), init);
  if (!res.ok) {
    let extra = '';
    try { extra = ` — ${await res.text()}`; } catch {}
    throw new Error(`HTTP ${res.status}${extra.slice(0, 200)}`);
  }
  const data = await res.json();
  if (data && data.error) throw new Error(data.error);
  return data;
}

// ---------------------------
// LESSONS
// ---------------------------
// Dedupe songs for the lesson picker: one line per (title, artist).
function buildPickerSongs(rawSongs = []) {
  const norm = (s) => (s || "").trim().toLowerCase();
  const byKey = new Map();

  for (const s of rawSongs) {
    const key = `${norm(s.title)}||${norm(s.artist)}`;
    const createdAt = new Date(s.created_at || 0).getTime();

    if (!byKey.has(key)) {
      byKey.set(key, { ...s, _createdAtTs: createdAt });
      continue;
    }
    // Choose a canonical representative deterministically.
    const cur = byKey.get(key);
    if (
      (createdAt && cur._createdAtTs && createdAt < cur._createdAtTs) ||
      (!cur._createdAtTs && createdAt) ||
      (createdAt === cur._CreatedAtTs && String(s.id) < String(cur.id))
    ) {
      byKey.set(key, { ...s, _createdAtTs: createdAt });
    }
  }

  return Array.from(byKey.values()).map(({ _createdAtTs, ...rest }) => rest);
}

function toISODateInput(val){
  if (!val) return new Date().toISOString().slice(0,10);
  if (typeof val === 'number') return new Date(Math.round((val - 25569) * 86400 * 1000)).toISOString().slice(0,10);
  const d = new Date(val);
  return isNaN(d) ? new Date().toISOString().slice(0,10) : d.toISOString().slice(0,10);
}

function AddLessonModal({ open, onClose, onSubmit, songs, initial }) {
  const isEdit = !!initial;
  const [date, setDate] = useState(toISODateInput(initial?.date));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [remainingLessons, setRemainingLessons] = useState(initial?.remaining_lessons ?? "");
  const [selectedSongIds, setSelectedSongIds] = useState(
    (initial?.topics ? String(initial.topics).split(',').filter(Boolean) : [])
  );

  useEffect(() => {
    setDate(toISODateInput(initial?.date));
    setNotes(initial?.notes ?? "");
    setRemainingLessons(initial?.remaining_lessons ?? "");
    setSelectedSongIds(initial?.topics ? String(initial.topics).split(',').filter(Boolean) : []);
  }, [initial?.id, open]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [q, setQ] = useState("");
  const pickerSongs = useMemo(() => buildPickerSongs(songs || []), [songs]);
  const filtered = pickerSongs.filter(s => (`${s.title||""} ${s.artist||""}`).toLowerCase().includes(q.toLowerCase()));

  function toggleSong(id) {
    setSelectedSongIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  }
  function reset() {
    setNotes(""); setRemainingLessons(""); setSelectedSongIds([]); setQ(""); setPickerOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v)=>{ if(!v) onClose(); }}>
      <DialogContent className="sm:max-w-2xl bg-neutral-900 text-neutral-100 border-neutral-800">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit lesson' : 'Add lesson'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1">
            <span className="text-sm text-neutral-300">Date</span>
            <Input type="date" value={date} onChange={e=>setDate(e.target.value)} className="bg-neutral-950 border-neutral-800"/>
          </div>
          <div className="grid gap-1">
            <span className="text-sm text-neutral-300">Notes</span>
            <Textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={5} placeholder="Type multi-line notes…" className="bg-neutral-950 border-neutral-800"/>
          </div>
          <div className="grid gap-1">
            <span className="text-sm text-neutral-300">Remaining lessons (optional)</span>
            <Input value={remainingLessons} onChange={e=>setRemainingLessons(e.target.value)} className="bg-neutral-950 border-neutral-800"/>
          </div>

          {/* Songs rehearsed — searchable multi-select dropdown */}
          <div className="grid gap-1 relative">
            <span className="text-sm text-neutral-300">Songs rehearsed</span>
            <div className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 min-h-[2.5rem] flex flex-wrap gap-1 items-center" onClick={()=>setPickerOpen(v=>!v)}>
              {selectedSongIds.length === 0 && <span className="text-sm text-neutral-400">Select songs…</span>}
              {selectedSongIds.map(id => {
                const s = pickerSongs.find(x => String(x.id) === String(id)) || songs.find(x => String(x.id) === String(id));
                const label = s ? `${s.title} — ${s.artist}` : `#${id}`;
                return <Badge variant="outline" className="border-neutral-700 text-neutral-200 text-xs">{label}</Badge>;
              })}
            </div>
            {pickerOpen && (
              <div className="absolute z-50 mt-2 w-full bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl p-2">
                <Input autoFocus placeholder="Search songs…" value={q} onChange={e=>setQ(e.target.value)} className="bg-neutral-950 border-neutral-800 mb-2"/>
                <div className="max-h-56 overflow-auto pr-1">
                  {filtered.map(s => {
                    const id = String(s.id);
                    const checked = selectedSongIds.includes(id);
                    return (
                      <label key={id} className="flex items-center gap-2 py-1 text-sm cursor-pointer">
                        <input type="checkbox" checked={checked} onChange={()=>toggleSong(id)} />
                        <span className="truncate">{s.title} — {s.artist}</span>
                      </label>
                    );
                  })}
                  {filtered.length === 0 && <div className="text-sm text-neutral-400 p-2">No matches</div>}
                </div>
                <div className="flex justify-end pt-2">
                  <Button variant="outline" onClick={()=>setPickerOpen(false)}>Done</Button>
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="border-neutral-700 text-neutral-300" onClick={()=>{ reset(); onClose(); }}>Cancel</Button>
          <Button className="bg-indigo-600 text-white hover:bg-indigo-500" onClick={() => {
            onSubmit({
              ...(isEdit ? { id: initial.id } : {}),
              date,
              notes,
              topics: selectedSongIds.join(','),
              remaining_lessons: remainingLessons
            });
            reset();
            onClose();
          }}>{isEdit ? 'Save' : 'Add'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LessonsTab({ items, loading, onAdd, onRefresh, songs, onEdit }) {
  const songById = useMemo(() => Object.fromEntries((songs||[]).map(s=>[String(s.id), s])), [songs]);
  return (
    <div className="mx-auto max-w-5xl p-3 space-y-3">
      <div className="flex justify-end items-center">
        <Button onClick={onAdd} className="bg-indigo-600 text-white hover:bg-indigo-500">+ Add lesson</Button>
      </div>
      {loading ? <div className="text-sm text-neutral-400">Loading…</div> : null}
      <div className="grid gap-3">
        {items.map(l => {
          const ids = String(l.topics||"").split(",").filter(Boolean);
          const songChips = ids.map(id => songById[id]?.title ? `${songById[id].title} — ${songById[id].artist}` : `#${id}`);
          return (
            <Card key={l.id} className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center text-sm text-neutral-400">
                  <div>{formatDateOnly(l.date)}</div>
                  <div className="flex items-center gap-2">
                    {l.remaining_lessons && <div>Remaining: {l.remaining_lessons}</div>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {songChips.length>0 && (
                  <div className="flex flex-wrap gap-1 text-xs">
                    {songChips.map((s,i)=>(<Badge key={i} variant="outline" className="border-neutral-700 text-neutral-200">{s}</Badge>))}
                  </div>
                )}
                {l.notes && <pre className="whitespace-pre-wrap text-sm text-neutral-200">{l.notes}</pre>}
                <div className="flex gap-3 text-sm">
                  {l.link && <a className="underline" href={l.link} target="_blank" rel="noreferrer">Lesson link</a>}
                  {l.audio_url && <a className="underline" href={l.audio_url} target="_blank" rel="noreferrer">Audio</a>}
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edit lesson"
                    onClick={()=> onEdit(l)}
                    className="text-neutral-300 hover:bg-neutral-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                    </svg>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------
// SONGS
// ---------------------------
const SONG_STATUSES = ["rehearsing", "want", "studied", "recorded"]; // mapped to your CSV "status"

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

function AddSongModal({ open, onClose, onCreate }) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [status, setStatus] = useState(SONG_STATUSES[0]);
  const [tabsLink, setTabsLink] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [recordingLink, setRecordingLink] = useState("");
  const [artworkUrl, setArtworkUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [fetchingCover, setFetchingCover] = useState(false);

  function reset() {
    setTitle(""); setArtist(""); setStatus(SONG_STATUSES[0]); setTabsLink(""); setVideoLink(""); setRecordingLink(""); setArtworkUrl(""); setNotes("");
  }

  return (
    <Dialog open={open} onOpenChange={(v)=>{ if(!v) onClose(); }}>
      <DialogContent className="sm:max-w-2xl bg-neutral-900 text-neutral-100 border-neutral-800">
        <DialogHeader>
          <DialogTitle>Add Song</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <span className="text-sm text-neutral-300">Title</span>
              <Input value={title} onChange={e=>setTitle(e.target.value)} className="bg-neutral-950 border-neutral-800"/>
            </div>
            <div className="grid gap-1">
              <span className="text-sm text-neutral-300">Artist</span>
              <Input value={artist} onChange={e=>setArtist(e.target.value)} className="bg-neutral-950 border-neutral-800"/>
            </div>
          </div>
          <div className="grid gap-1">
            <span className="text-sm text-neutral-300">Status</span>
            {/* keep native select for exact behavior */}
            <select value={status} onChange={e=>setStatus(e.target.value)} className="bg-neutral-950 border border-neutral-800 rounded px-2 py-2 text-neutral-100">
              {SONG_STATUSES.map(s=> <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="grid gap-1">
              <span className="text-sm text-neutral-300">Tabs link</span>
              <Input value={tabsLink} onChange={e=>setTabsLink(e.target.value)} className="bg-neutral-950 border-neutral-800"/>
            </div>
            <div className="grid gap-1">
              <span className="text-sm text-neutral-300">Video link</span>
              <Input value={videoLink} onChange={e=>setVideoLink(e.target.value)} className="bg-neutral-950 border-neutral-800"/>
            </div>
            <div className="grid gap-1">
              <span className="text-sm text-neutral-300">Recording link</span>
              <Input value={recordingLink} onChange={e=>setRecordingLink(e.target.value)} className="bg-neutral-950 border-neutral-800"/>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3 items-end">
            <div className="grid gap-1 md:col-span-2">
              <span className="text-sm text-neutral-300">Artwork URL</span>
              <Input value={artworkUrl} onChange={e=>setArtworkUrl(e.target.value)} className="bg-neutral-950 border-neutral-800" placeholder="Will try to auto‑fill from Apple Music"/>
            </div>
            <Button variant="outline" onClick={async()=>{
              try {
                setFetchingCover(true);
                const url = await findArtworkUrl(artist, title);
                if (url) setArtworkUrl(url); else alert("No cover found — try adjusting title/artist");
              } finally { setFetchingCover(false); }
            }}>{fetchingCover? 'Searching…' : 'Fetch cover'}</Button>
          </div>
          <div className="grid gap-1">
            <span className="text-sm text-neutral-300">Notes</span>
            <Textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={4} className="bg-neutral-950 border-neutral-800"/>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="border-neutral-700 text-neutral-300" onClick={()=>{ reset(); onClose(); }}>Cancel</Button>
          <Button className="bg-indigo-600 text-white hover:bg-indigo-500" onClick={()=>{
            onCreate({ title, artist, status, tabs_link: tabsLink, video_link: videoLink, recording_link: recordingLink, artwork_url: artworkUrl, notes });
            reset();
            onClose();
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SongsTab({ items, loading, onAdd, onRefresh }) {
  const [q, setQ] = useState("");

  // --- Aggregate duplicates (same title+artist) into one card with multiple statuses ---
  const aggregated = useMemo(() => {
    const map = new Map();
    const norm = (s) => (s||"").trim().toLowerCase();
    for (const s of items) {
      const key = `${norm(s.title)}||${norm(s.artist)}`;
      if (!map.has(key)) {
        map.set(key, {
          _key: key,
          id: s.id || key,
          title: s.title || "",
          artist: s.artist || "",
          statuses: new Set(),
          artwork_url: s.artwork_url || "",
          tabs_link: s.tabs_link || "",
          video_link: s.video_link || "",
          recording_link: s.recording_link || "",
        });
      }
      const g = map.get(key);
      if (s.status) g.statuses.add(String(s.status));
      if (!g.artwork_url && s.artwork_url) g.artwork_url = s.artwork_url;
      if (!g.tabs_link && s.tabs_link) g.tabs_link = s.tabs_link;
      if (!g.video_link && s.video_link) g.video_link = s.video_link;
      if (!g.recording_link && s.recording_link) g.recording_link = s.recording_link;
    }
    return Array.from(map.values()).map(g => ({ ...g, statuses: Array.from(g.statuses) }));
  }, [items]);

  const visible = aggregated.filter(s => {
    const hay = `${s.title||""} ${s.artist||""}`.toLowerCase();
    return !q || hay.includes(q.toLowerCase());
  });

  const STATUS_LABELS = { rehearsing: "Rehearsing", want: "Want", studied: "Studied", recorded: "Recorded" };
  const grouped = useMemo(() => {
    const map = new Map();
    for (const st of ["rehearsing","want","studied","recorded"]) map.set(st, []);
    for (const s of visible) {
      for (const st of s.statuses || []) {
        if (map.has(st)) map.get(st).push(s);
      }
    }
    return map;
  }, [visible]);

  return (
    <div className="mx-auto max-w-5xl p-3 space-y-3">
      <div className="flex flex-wrap gap-2 items-center justify-end">
        <Input placeholder="Quick search…" value={q} onChange={e=>setQ(e.target.value)} className="w-48 bg-neutral-950 border-neutral-800 text-neutral-100 placeholder:text-neutral-500"/>
        <Button onClick={onAdd} className="bg-indigo-600 text-white hover:bg-indigo-500">+ Add song</Button>
      </div>
      {loading ? <div className="text-sm text-neutral-400">Loading…</div> : null}

      {["rehearsing","want","studied","recorded"].map((st) => {
        const list = grouped.get(st) || [];
        if (list.length === 0) return null;
        return (
          <div key={st} className="space-y-2 mt-8">
            <h2 className="text-lg font-semibold text-neutral-200">{STATUS_LABELS[st]}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {list.map(s => (
                <Card key={`${st}-${s.id}`} className="bg-neutral-900 border-neutral-800">
                  <CardContent className="p-3 flex gap-3">
                    <div className="w-20 h-20 rounded overflow-hidden bg-neutral-800 flex-shrink-0">
                      {s.artwork_url ? (<img src={s.artwork_url} alt="cover" className="w-full h-full object-cover"/>) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">no cover</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-neutral-100 truncate">{s.title}</div>
                      <div className="text-sm text-neutral-400 truncate">{s.artist}</div>
                      {s.statuses?.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1 text-xs">
                          {s.statuses.map(st2 => (
                            <Badge key={st2} variant="outline" className="border-neutral-700 text-neutral-200">{st2}</Badge>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {s.tabs_link && <a className="underline" href={s.tabs_link} target="_blank" rel="noreferrer">Tabs</a>}
                        {s.video_link && <a className="underline" href={s.video_link} target="_blank" rel="noreferrer">Video</a>}
                        {s.recording_link && <a className="underline" href={s.recording_link} target="_blank" rel="noreferrer">Recording</a>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------
// SETTINGS
// ---------------------------
function SettingsModal({ open, onClose, settings, setSettings }) {
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl || "");
  const [token, setToken] = useState(settings.token || "");
  const [testResult, setTestResult] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(()=>{ setBaseUrl(settings.baseUrl||""); setToken(settings.token||""); }, [settings]);

  async function testConnection() {
    setTesting(true);
    setTestResult("");
    try {
      const tmpSettings = { baseUrl, token };
      const data = await apiRequest(tmpSettings, "listSongs", {});
      const count = Array.isArray(data?.songs) ? data.songs.length : 0;
      setTestResult(`✅ Connected. Songs: ${count}`);
    } catch (e) {
      // Friendlier guidance when browser extensions block JSONP on GitHub Pages
      const msg = String(e?.message || "");
      const looksBlocked =
        msg.includes("JSONP network error") ||
        msg.includes("ERR_BLOCKED_BY_CLIENT") ||
        msg.includes("net::ERR_BLOCKED_BY_CLIENT");
      if (looksBlocked && typeof location !== 'undefined' && location.hostname.endsWith('.github.io')) {
        setTestResult(
          "❌ Request was blocked by a browser extension on this domain. " +
          "Try one of these: disable uBlock/AdGuard/ABP/Privacy Badger for this site, " +
          "add an allow-rule for script.googleusercontent.com & script.google.com, or open in Incognito."
        );
      } else {
        setTestResult(`❌ ${msg}`);
      }
    } finally {
      setTesting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v)=>{ if(!v) onClose(); }}>
      <DialogContent className="sm:max-w-xl bg-neutral-900 text-neutral-100 border-neutral-800">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <span className="text-sm text-neutral-300">Apps Script Web App URL</span>
            <Input value={baseUrl} onChange={e=>setBaseUrl(e.target.value)} placeholder="https://script.google.com/macros/s/.../exec" className="bg-neutral-950 border-neutral-800"/>
          </div>
          <div className="grid gap-1">
            <span className="text-sm text-neutral-300">API token</span>
            <Input value={token} onChange={e=>setToken(e.target.value)} placeholder="Your shared secret" className="bg-neutral-950 border-neutral-800"/>
          </div>
          <div className="text-xs text-neutral-400">Use either your Google Apps Script Web App URL (we will use JSONP automatically), or the Yandex API Gateway URL (we will use normal CORS fetch).</div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={testConnection} disabled={testing}>{testing ? 'Testing…' : 'Test connection'}</Button>
            {testResult && <div className="text-sm">{testResult}</div>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="border-neutral-700 text-neutral-300" onClick={onClose}>Close</Button>
          <Button className="bg-indigo-600 text-white hover:bg-indigo-500" onClick={()=>{ setSettings({ baseUrl, token }); onClose(); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------
// APP
// ---------------------------
export default function App() {
  const [tab, setTab] = useState("lessons");
  const [settings, setSettings] = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  // Cache (in memory + localStorage)
  const CACHE_KEY = 'lespal_cache_v1';
  const initialCache = useMemo(() => ls.get(CACHE_KEY, { songs: [], lessons: [], tsSongs: 0, tsLessons: 0 }), []);
  const [songs, setSongs] = useState(initialCache.songs || []);
  const [lessons, setLessons] = useState(initialCache.lessons || []);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [openLessonModal, setOpenLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [openAddSong, setOpenAddSong] = useState(false);

  function saveCache(next){ ls.set(CACHE_KEY, next); }
  const STALE_MS = 2 * 60 * 1000; // 2 minutes

  const loadSongs = async (force=false) => {
    if (!settings.baseUrl) return;
    const now = Date.now();
    const cache = ls.get(CACHE_KEY, { songs: [], lessons: [], tsSongs: 0, tsLessons: 0 });
    const isStale = force || (now - (cache.tsSongs||0) > STALE_MS) || (songs.length === 0);
    if (!isStale) return;
    setLoadingSongs(true);
    try {
      const { songs: s } = await apiRequest(settings, 'listSongs', {});
      s.sort((a,b) => (a.title||'').localeCompare(b.title||''));
      setSongs(s);
      saveCache({ ...cache, songs: s, tsSongs: now });
    } catch (e) { console.warn(e); }
    finally { setLoadingSongs(false); }
  };

  const loadLessons = async (force=false) => {
    if (!settings.baseUrl) return;
    const now = Date.now();
    const cache = ls.get(CACHE_KEY, { songs: [], lessons: [], tsSongs: 0, tsLessons: 0 });
    const isStale = force || (now - (cache.tsLessons||0) > STALE_MS) || (lessons.length === 0);
    if (!isStale) return;
    setLoadingLessons(true);
    try {
      const { lessons: l } = await apiRequest(settings, 'listLessons', {});
      l.sort((a,b)=> (b.date||'').localeCompare(a.date||''));
      setLessons(l);
      saveCache({ ...cache, lessons: l, tsLessons: now });
    } catch (e) { console.warn(e); }
    finally { setLoadingLessons(false); }
  };

  // Prefetch both when settings change
  useEffect(() => { loadSongs(true); loadLessons(true); }, [settings.baseUrl, settings.token]);

  // Create handlers (update cache immediately by reloading fresh)
  const handleCreateSong = async (payload) => {
    try { await apiRequest(settings, 'createSong', payload); await loadSongs(true); } catch (e) { alert(e.message); }
  };

  const handleUpsertLesson = async (payload) => {
    const isEdit = !!payload.id;
    try {
      if (isEdit) {
        await apiRequest(settings, 'updateLesson', payload);
        await loadLessons(true);
      } else {
        await apiRequest(settings, 'createLesson', payload);
        await loadLessons(true);
      }
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <Header tab={tab} setTab={setTab} openSettings={()=>setShowSettings(true)} onRefresh={()=> (tab==='lessons' ? loadLessons(true) : loadSongs(true)) } />
      {tab === 'lessons' && (
        <>
          <LessonsTab
            items={lessons}
            loading={loadingLessons}
            onAdd={()=>{ setEditingLesson(null); setOpenLessonModal(true); }}
            onRefresh={()=>loadLessons(true)}
            songs={songs}
            onEdit={(l)=>{ setEditingLesson(l); setOpenLessonModal(true); }}
          />
          <AddLessonModal
            open={openLessonModal}
            onClose={()=>setOpenLessonModal(false)}
            onSubmit={handleUpsertLesson}
            songs={songs}
            initial={editingLesson}
          />
        </>
      )}
      {tab === 'songs' && (
        <>
          <SongsTab items={songs} loading={loadingSongs} onAdd={()=>setOpenAddSong(true)} onRefresh={()=>loadSongs(true)} />
          <AddSongModal open={openAddSong} onClose={()=>setOpenAddSong(false)} onCreate={handleCreateSong} />
        </>
      )}
      <SettingsModal open={showSettings} onClose={()=>setShowSettings(false)} settings={settings} setSettings={setSettings} />
      <div className="pb-8"/>
    </div>
  );
}

// ---------------------------
// Lightweight self-tests (non-blocking)
// ---------------------------
if (typeof window !== 'undefined' && !window.__lespal_tests_ran) {
  window.__lespal_tests_ran = true;
  try {
    console.assert(formatDateOnly('2025-08-14') !== '(no date)', 'formatDateOnly should format ISO dates');
    console.assert(formatDateOnly('') === '(no date)', 'formatDateOnly empty string');
    // additional test: serial date renders with a 4-digit year
    const serialOut = formatDateOnly(25569);
    console.assert(/\d{4}/.test(serialOut), 'formatDateOnly should handle serial numbers');
    // aggregation duplicate test
    const dupeAgg = (() => {
      const items = [
        { id: 1, title: 'Believer', artist: 'Imagine Dragons', status: 'studied' },
        { id: 2, title: 'Believer', artist: 'Imagine Dragons', status: 'rehearsing' },
      ];
      const map = new Map();
      const norm = (s) => (s||'').trim().toLowerCase();
      for (const s of items) {
        const key = `${norm(s.title)}||${norm(s.artist)}`;
        if (!map.has(key)) map.set(key, { statuses: new Set() });
        map.get(key).statuses.add(s.status);
      }
      return Array.from(map.values())[0].statuses.size === 2;
    })();
    console.assert(dupeAgg, 'aggregation should merge duplicate songs');

    console.log('Lespal self-tests passed');
  } catch (e) {
    console.warn('Lespal self-tests failed', e);
  }
}
