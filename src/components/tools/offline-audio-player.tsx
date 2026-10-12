"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  Upload,
  Trash2,
  Music,
  Volume2,
  X,
  ChevronRight,
  ChevronDown,
  Search,
  Repeat,
  Repeat1,
  Shuffle,
  Gauge,
  Download,
  Package,
  List,
  Check,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
   OFFLINE AUDIO PLAYER — Ministar English
   ============================================================
   v2 Features:
   - Stores MP3 files in IndexedDB (works fully offline)
   - 12-level curriculum menu structure
   - Weeks 1-40 inside each of the 9 class levels (#1-#9)
   - Levels 10-12 use "General" (no weeks)
   - Drag & drop upload + file picker
   - Search across all tracks
   - Play/pause/seek/volume controls
   - Repeat one / Repeat all / Shuffle modes
   - Speed control (0.5x, 0.75x, 1x, 1.25x, 1.5x)
   - Persistent across sessions (IndexedDB survives refresh)
   ============================================================ */

// ===== Curriculum Levels =====
const LEVELS = [
  { id: 1,  name: "Kindy Foundation Classes",          short: "K-Foundation",  color: "from-pink-400 to-rose-500",     emoji: "🌱",  hasWeeks: true,  hasSubcats: false },
  { id: 2,  name: "Kindy Bronze Classes",               short: "K-Bronze",      color: "from-amber-600 to-yellow-700",  emoji: "🥉",  hasWeeks: true,  hasSubcats: false },
  { id: 3,  name: "Kindy Plus Classes",                 short: "K-Plus",        color: "from-orange-400 to-red-500",    emoji: "⭐",  hasWeeks: true,  hasSubcats: false },
  { id: 4,  name: "E-Silver - Yr1",                     short: "E-Silver-Yr1",  color: "from-slate-300 to-slate-500",   emoji: "🥈",  hasWeeks: true,  hasSubcats: false },
  { id: 5,  name: "E-Gold - Yr2",                       short: "E-Gold-Yr2",    color: "from-yellow-400 to-amber-500",  emoji: "🥇",  hasWeeks: true,  hasSubcats: false },
  { id: 6,  name: "E-Platinum - Yr3",                   short: "E-Platinum-Yr3",color: "from-cyan-300 to-teal-400",     emoji: "💎",  hasWeeks: true,  hasSubcats: false },
  { id: 7,  name: "E-Titanium - Yr4",                   short: "E-Titanium-Yr4",color: "from-slate-400 to-zinc-600",    emoji: "⚙️",  hasWeeks: true,  hasSubcats: false },
  { id: 8,  name: "E-Diamond - Yr5",                    short: "E-Diamond-Yr5", color: "from-cyan-400 to-blue-500",     emoji: "💠",  hasWeeks: true,  hasSubcats: false },
  { id: 9,  name: "E-Stardust - Yr6 & JHS",             short: "E-Stardust-JHS",color: "from-purple-500 to-indigo-600", emoji: "✨",  hasWeeks: true,  hasSubcats: false },
  { id: 10, name: "Adult",                               short: "Adult",         color: "from-emerald-500 to-green-600", emoji: "🎓",  hasWeeks: false, hasSubcats: false },
  { id: 11, name: "EIKEN Test",                          short: "EIKEN",         color: "from-blue-600 to-indigo-700",   emoji: "📝",  hasWeeks: false, hasSubcats: false },
  { id: 12, name: "Ministar Originals",                  short: "MO",            color: "from-fuchsia-500 to-pink-600",  emoji: "🎵",  hasWeeks: false, hasSubcats: false },
  { id: 13, name: "Events",                              short: "Events",        color: "from-red-500 via-orange-500 to-yellow-500", emoji: "🎉", hasWeeks: false, hasSubcats: true },
] as const;

// Sub-categories for Level 13 (Events)
const EVENT_SUBCATS = [
  { id: "concerts",     name: "Concerts",      emoji: "🎤" },
  { id: "easter",       name: "Easter",        emoji: "🐰" },
  { id: "summer-school",name: "Summer School",  emoji: "☀️" },
  { id: "halloween",    name: "Halloween",     emoji: "🎃" },
  { id: "christmas",    name: "Christmas",     emoji: "🎄" },
  { id: "new-year",     name: "New Year",      emoji: "🎆" },
] as const;

const WEEKS_PER_LEVEL = 40;

// ===== IndexedDB Helpers =====
const DB_NAME = "classroom-tools-audio-player";
const DB_VERSION = 3;  // bumped to v3 for playlists
const STORE_NAME = "tracks";
const PLAYLIST_STORE = "playlists";

interface AudioTrack {
  id: string;
  name: string;
  fileName: string;
  level: number;         // 1-13
  week?: number;         // 1-40 (only for levels 1-9)
  subcat?: string;       // sub-category id (for Level 13 Events: concerts, easter, etc.)
  unit?: string;         // optional unit/lesson name
  size: number;
  type: string;
  duration?: number;
  blob: Blob;
  createdAt: number;
}

interface Playlist {
  id: string;
  name: string;
  trackIds: string[];    // ordered list of track IDs
  createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("level", "level", { unique: false });
        store.createIndex("week", "week", { unique: false });
        store.createIndex("name", "name", { unique: false });
      }
      if (!db.objectStoreNames.contains(PLAYLIST_STORE)) {
        db.createObjectStore(PLAYLIST_STORE, { keyPath: "id" });
      }
    };
  });
}

async function dbGetAllTracks(): Promise<AudioTrack[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as AudioTrack[]);
    req.onerror = () => reject(req.error);
  });
}

async function dbAddTrack(track: AudioTrack): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.add(track);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function dbDeleteTrack(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function dbClearAll(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ===== Playlist DB functions =====
async function dbGetAllPlaylists(): Promise<Playlist[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PLAYLIST_STORE, "readonly");
    const store = tx.objectStore(PLAYLIST_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as Playlist[]);
    req.onerror = () => reject(req.error);
  });
}

async function dbSavePlaylist(playlist: Playlist): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PLAYLIST_STORE, "readwrite");
    const store = tx.objectStore(PLAYLIST_STORE);
    const req = store.put(playlist);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function dbDeletePlaylist(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PLAYLIST_STORE, "readwrite");
    const store = tx.objectStore(PLAYLIST_STORE);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ===== Export all tracks + playlists as downloadable files =====
// Creates downloadable audio files + a playlists JSON that can be imported on another device
async function exportAllTracks(playlists: Playlist[]): Promise<void> {
  const allTracks = await dbGetAllTracks();
  if (allTracks.length === 0) {
    alert("No tracks to export.");
    return;
  }

  // Build a map of trackId → exported filename (for playlist export)
  const trackIdToFilename: Record<string, string> = {};
  for (const track of allTracks) {
    const prefix = `L${track.level}${track.week ? `-W${track.week}` : ""}${track.subcat ? `-${track.subcat}` : ""}`;
    trackIdToFilename[track.id] = `${prefix}_${track.fileName}`;
  }

  // Export playlists as JSON (using filenames, not IDs — so they survive import)
  if (playlists.length > 0) {
    const playlistsExport = playlists.map(pl => ({
      name: pl.name,
      filenames: pl.trackIds.map(id => trackIdToFilename[id]).filter(Boolean),
    }));
    const playlistsBlob = new Blob([JSON.stringify(playlistsExport, null, 2)], { type: "application/json" });
    const playlistsUrl = URL.createObjectURL(playlistsBlob);
    const pa = document.createElement("a");
    pa.href = playlistsUrl;
    pa.download = "playlists-export.json";
    pa.click();
    URL.revokeObjectURL(playlistsUrl);
  }

  // Download each audio file
  for (let i = 0; i < allTracks.length; i++) {
    const track = allTracks[i];
    const url = URL.createObjectURL(track.blob);
    const link = document.createElement("a");
    link.href = url;
    const prefix = `L${track.level}${track.week ? `-W${track.week}` : ""}${track.subcat ? `-${track.subcat}` : ""}`;
    link.download = `${prefix}_${track.fileName}`;
    link.click();
    URL.revokeObjectURL(url);
    if (i % 5 === 4) await new Promise(r => setTimeout(r, 500));
  }

  const playlistCount = playlists.length > 0 ? `\n+ ${playlists.length} playlist(s)` : "";
  alert(`Exported ${allTracks.length} tracks!${playlistCount}\n\nFiles downloaded to your Downloads folder.\nTo import on another device:\n1. Click "Import"\n2. Select ALL files (audio + playlists-export.json)\n3. Tracks AND playlists will be recreated.`);
}

// ===== Import tracks from audio files (preserves metadata from filenames) =====
async function importTracksFromFiles(
  files: FileList,
  parseLevel: (fileName: string) => { level: number; week?: number; subcat?: string; name: string }
): Promise<number> {
  let imported = 0;
  for (const file of Array.from(files)) {
    if (!file.type.startsWith("audio/")) continue;
    const parsed = parseLevel(file.name);
    const track: AudioTrack = {
      id: `track-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: parsed.name,
      fileName: file.name,
      level: parsed.level,
      week: parsed.week,
      subcat: parsed.subcat,
      size: file.size,
      type: file.type,
      blob: file,
      createdAt: Date.now(),
    };
    try {
      await dbAddTrack(track);
      imported++;
    } catch (e) {
      console.error("Failed to import:", file.name, e);
    }
  }
  return imported;
}

type PlayMode = "normal" | "repeat-one" | "repeat-all" | "shuffle";
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];

// ===== Component =====
export function OfflineAudioPlayer() {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set()); // "levelId-weekNum"
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploadLevel, setUploadLevel] = useState(1);
  const [uploadWeek, setUploadWeek] = useState<number | "">("");
  const [uploadSubcat, setUploadSubcat] = useState<string>("");
  const [uploadUnit, setUploadUnit] = useState("");
  const [uploading, setUploading] = useState(false);

  // Playlist state
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showPlaylistBuilder, setShowPlaylistBuilder] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());
  const [expandedPlaylist, setExpandedPlaylist] = useState<string | null>(null);

  // Player state
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);  // index into current playlist
  const [currentPlaylist, setCurrentPlaylist] = useState<AudioTrack[]>([]);  // tracks to play through
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [playMode, setPlayMode] = useState<PlayMode>("normal");
  const [speed, setSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Load tracks from IndexedDB on mount
  useEffect(() => { loadTracks(); loadPlaylists(); }, []);

  const loadPlaylists = async () => {
    try {
      const all = await dbGetAllPlaylists();
      all.sort((a, b) => a.name.localeCompare(b.name));
      setPlaylists(all);
    } catch (e) {
      console.error("Failed to load playlists:", e);
    }
  };

  const loadTracks = async () => {
    try {
      setLoading(true);
      const all = await dbGetAllTracks();
      // Natural sort: handles "001", "001b", "002", "010", "100" correctly
      const naturalCompare = (a: string, b: string) => {
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
      };
      all.sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        if (a.week !== b.week) return (a.week ?? 999) - (b.week ?? 999);
        // Sort by original filename to preserve "001, 001b, 002" order
        return naturalCompare(a.fileName, b.fileName);
      });
      setTracks(all);
    } catch (e) {
      console.error("Failed to load tracks:", e);
    } finally {
      setLoading(false);
    }
  };

  // Create object URL for current track
  useEffect(() => {
    if (currentTrack) {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
      const url = URL.createObjectURL(currentTrack.blob);
      objectUrlRef.current = url;
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.volume = volume;
        audioRef.current.playbackRate = speed;
      }
    }
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [currentTrack]);

  // ===== Play a track (with playlist context) =====
  const handlePlay = useCallback((track: AudioTrack, playlist: AudioTrack[]) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play().catch(() => {});
      }
    } else {
      setCurrentPlaylist(playlist);
      const idx = playlist.findIndex(t => t.id === track.id);
      setCurrentIndex(idx);
      setCurrentTrack(track);
      setIsPlaying(true);
      setTimeout(() => audioRef.current?.play().catch(() => {}), 100);
    }
  }, [currentTrack, isPlaying]);

  const togglePlay = () => {
    if (isPlaying) audioRef.current?.pause();
    else audioRef.current?.play().catch(() => {});
  };

  // ===== Play next/prev in playlist =====
  const playNext = useCallback(() => {
    if (currentPlaylist.length === 0) return;
    let nextIdx: number;
    if (playMode === "shuffle") {
      nextIdx = Math.floor(Math.random() * currentPlaylist.length);
    } else {
      nextIdx = currentIndex + 1;
      if (nextIdx >= currentPlaylist.length) {
        if (playMode === "repeat-all") nextIdx = 0;
        else { setIsPlaying(false); return; }
      }
    }
    setCurrentIndex(nextIdx);
    setCurrentTrack(currentPlaylist[nextIdx]);
    setIsPlaying(true);
    setTimeout(() => audioRef.current?.play().catch(() => {}), 100);
  }, [currentPlaylist, currentIndex, playMode]);

  const playPrev = () => {
    if (currentPlaylist.length === 0) return;
    const prevIdx = currentIndex - 1 < 0 ? currentPlaylist.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIdx);
    setCurrentTrack(currentPlaylist[prevIdx]);
    setIsPlaying(true);
    setTimeout(() => audioRef.current?.play().catch(() => {}), 100);
  };

  // ===== Upload =====
  const handleFileUpload = async (files: FileList) => {
    setUploading(true);
    try {
      let uploadedCount = 0;
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("audio/")) continue;
        const track: AudioTrack = {
          id: `track-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name.replace(/\.[^/.]+$/, ""),
          fileName: file.name,
          level: uploadLevel,
          week: uploadWeek === "" ? undefined : uploadWeek,
          subcat: uploadSubcat || undefined,
          unit: uploadUnit.trim() || undefined,
          size: file.size,
          type: file.type,
          blob: file,
          createdAt: Date.now(),
        };
        await dbAddTrack(track);
        uploadedCount++;
      }
      await loadTracks();
      // Auto-expand the level that just received tracks
      setExpandedLevel(uploadLevel);
      // If week was specified, auto-expand that week too
      if (uploadWeek !== "") {
        setExpandedWeeks(prev => {
          const next = new Set(prev);
          next.add(`${uploadLevel}-${uploadWeek}`);
          return next;
        });
      }
      // If subcat was specified, auto-expand that subcat
      if (uploadSubcat) {
        setExpandedWeeks(prev => {
          const next = new Set(prev);
          next.add(`${uploadLevel}-${uploadSubcat}`);
          return next;
        });
      }
      setShowUpload(false);
      setUploadUnit("");
      // Show success message
      if (uploadedCount > 0) {
        const levelName = LEVELS[uploadLevel - 1]?.name ?? `Level ${uploadLevel}`;
        const weekInfo = uploadWeek !== "" ? ` Week ${uploadWeek}` : "";
        const subcatInfo = uploadSubcat ? ` ${EVENT_SUBCATS.find(s => s.id === uploadSubcat)?.name}` : "";
        alert(`✅ Uploaded ${uploadedCount} track(s) to:\n${levelName}${weekInfo}${subcatInfo}\n\nScroll to that level to see your tracks.`);
      }
    } catch (e) {
      console.error("Upload failed:", e);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ===== Delete =====
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this track? This cannot be undone.")) return;
    try {
      await dbDeleteTrack(id);
      if (currentTrack?.id === id) {
        audioRef.current?.pause();
        setCurrentTrack(null);
        setIsPlaying(false);
      }
      await loadTracks();
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  // ===== Playlist management =====
  const toggleTrackSelection = (trackId: string) => {
    setSelectedTrackIds(prev => {
      const next = new Set(prev);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
  };

  const handleCreatePlaylist = async () => {
    if (selectedTrackIds.size === 0) {
      alert("Select at least one track first.");
      return;
    }
    const name = playlistName.trim() || `Playlist ${playlists.length + 1}`;
    const playlist: Playlist = {
      id: `playlist-${Date.now()}`,
      name,
      trackIds: Array.from(selectedTrackIds),
      createdAt: Date.now(),
    };
    await dbSavePlaylist(playlist);
    await loadPlaylists();
    setShowPlaylistBuilder(false);
    setPlaylistName("");
    setSelectedTrackIds(new Set());
  };

  const handleDeletePlaylist = async (id: string) => {
    if (!confirm("Delete this playlist? (Tracks are NOT deleted, only the playlist)")) return;
    await dbDeletePlaylist(id);
    await loadPlaylists();
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    // Get actual track objects for the playlist (in order)
    const playlistTracks = playlist.trackIds
      .map(id => tracks.find(t => t.id === id))
      .filter((t): t is AudioTrack => t !== undefined);
    if (playlistTracks.length === 0) {
      alert("This playlist has no playable tracks (tracks may have been deleted).");
      return;
    }
    handlePlay(playlistTracks[0], playlistTracks);
  };

  const handleRemoveFromPlaylist = async (playlist: Playlist, trackId: string) => {
    const updated: Playlist = {
      ...playlist,
      trackIds: playlist.trackIds.filter(id => id !== trackId),
    };
    await dbSavePlaylist(updated);
    await loadPlaylists();
  };

  // ===== Week expansion toggle =====
  const toggleWeek = (levelId: number, week: number) => {
    const key = `${levelId}-${week}`;
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSubcat = (levelId: number, subcatId: string) => {
    const key = `${levelId}-${subcatId}`;
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ===== Format helpers =====
  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ===== Filter tracks =====
  const filteredTracks = searchQuery
    ? tracks.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.unit?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        LEVELS[t.level - 1]?.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tracks;

  const tracksByLevel = (levelId: number) => filteredTracks.filter(t => t.level === levelId);
  const tracksByWeek = (levelId: number, week: number) =>
    tracksByLevel(levelId).filter(t => t.week === week);
  const tracksGeneral = (levelId: number) =>
    tracksByLevel(levelId).filter(t => t.week === undefined || t.week === null);

  const totalSize = tracks.reduce((sum, t) => sum + t.size, 0);

  // ===== Audio event handlers =====
  const onTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };
  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = speed;
    }
  };
  const onEnded = () => {
    if (playMode === "repeat-one") {
      // Replay the same track
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } else {
      playNext();
    }
  };
  const onPlay = () => setIsPlaying(true);
  const onPause = () => setIsPlaying(false);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const handleSpeedChange = () => {
    const currentIdx = SPEEDS.indexOf(speed);
    const nextIdx = (currentIdx + 1) % SPEEDS.length;
    const newSpeed = SPEEDS[nextIdx];
    setSpeed(newSpeed);
    if (audioRef.current) audioRef.current.playbackRate = newSpeed;
  };

  const cyclePlayMode = () => {
    const modes: PlayMode[] = ["normal", "repeat-one", "repeat-all", "shuffle"];
    const idx = modes.indexOf(playMode);
    setPlayMode(modes[(idx + 1) % modes.length]);
  };

  // ===== Skip ±10 seconds =====
  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
    }
  };
  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
    }
  };

  // ===== Sleep timer =====
  const [sleepTimer, setSleepTimer] = useState<number | null>(null); // minutes, null = off
  const [sleepTimerEnd, setSleepTimerEnd] = useState<number | null>(null); // timestamp when timer ends
  const sleepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toggleSleepTimer = () => {
    const presets = [5, 10, 15, 30, 60]; // minutes
    if (sleepTimer === null) {
      // Start with first preset (5 min)
      const mins = presets[0];
      setSleepTimer(mins);
      setSleepTimerEnd(Date.now() + mins * 60 * 1000);
    } else {
      // Cycle through presets, then off
      const currentIdx = presets.indexOf(sleepTimer);
      if (currentIdx === presets.length - 1) {
        // Turn off
        setSleepTimer(null);
        setSleepTimerEnd(null);
        if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
      } else {
        // Next preset
        const mins = presets[currentIdx + 1];
        setSleepTimer(mins);
        setSleepTimerEnd(Date.now() + mins * 60 * 1000);
      }
    }
  };

  useEffect(() => {
    if (sleepTimerEnd) {
      sleepTimerRef.current = setInterval(() => {
        if (Date.now() >= sleepTimerEnd) {
          // Time's up — pause playback
          audioRef.current?.pause();
          setSleepTimer(null);
          setSleepTimerEnd(null);
          if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
          alert("⏰ Sleep timer ended — playback paused.");
        }
      }, 1000);
      return () => {
        if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
      };
    }
  }, [sleepTimerEnd]);

  // ===== Download current track =====
  const downloadCurrentTrack = () => {
    if (!currentTrack) return;
    const url = URL.createObjectURL(currentTrack.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = currentTrack.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ===== Remaining time in sleep timer =====
  const sleepTimerRemaining = sleepTimerEnd ? Math.max(0, Math.ceil((sleepTimerEnd - Date.now()) / 60000)) : null;

  // ===== Render a track row =====
  const renderTrack = (track: AudioTrack, playlist: AudioTrack[]) => {
    const isCurrent = currentTrack?.id === track.id;
    return (
      <div
        key={track.id}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 transition-all group",
          isCurrent ? "bg-purple-500/20" : "hover:bg-white/5"
        )}
      >
        <button
          onClick={() => handlePlay(track, playlist)}
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all",
            isCurrent && isPlaying
              ? "bg-amber-500 text-white animate-pulse"
              : isCurrent
                ? "bg-purple-500 text-white"
                : "bg-white/10 text-white hover:bg-white/20"
          )}
        >
          {isCurrent && isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-bold truncate", isCurrent ? "text-purple-300" : "text-white")}>
            {track.name}
          </p>
          <div className="flex items-center gap-2 text-xs text-white/40">
            {track.unit && <span className="px-1.5 py-0.5 rounded bg-white/10">{track.unit}</span>}
            <span>{formatSize(track.size)}</span>
            {track.duration && <span>· {formatTime(track.duration)}</span>}
          </div>
        </div>
        <button
          onClick={() => handleDelete(track.id)}
          className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2 w-full">
      {/* Header */}
      <div className="w-full max-w-5xl flex items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎵</span>
          <div>
            <h2 className="text-xl font-bold text-white">Offline Audio Player</h2>
            <p className="text-xs text-white/70">
              {tracks.length} tracks · {formatSize(totalSize)} stored offline
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Playlists button */}
          {tracks.length > 0 && (
            <Button
              onClick={() => setShowPlaylistBuilder(!showPlaylistBuilder)}
              variant="outline"
              className="rounded-full px-4 bg-white/10 text-white border-white/25 hover:bg-white/20 font-bold"
              title="Create and manage playlists"
            >
              <List className="mr-2 h-4 w-4" />
              Playlists ({playlists.length})
            </Button>
          )}
          {/* Export library button */}
          {tracks.length > 0 && (
            <Button
              onClick={() => exportAllTracks(playlists)}
              variant="outline"
              className="rounded-full px-4 bg-white/10 text-white border-white/25 hover:bg-white/20 font-bold"
              title="Download all tracks for backup or transfer to another device"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
          {/* Import library button */}
          <Button
            onClick={() => importInputRef.current?.click()}
            variant="outline"
            className="rounded-full px-4 bg-white/10 text-white border-white/25 hover:bg-white/20 font-bold"
            title="Import tracks from exported audio files"
          >
            <Package className="mr-2 h-4 w-4" />
            Import
          </Button>
          {/* Upload button */}
          <Button
            onClick={() => setShowUpload(!showUpload)}
            className="rounded-full px-5 bg-white text-slate-900 hover:bg-white/90 font-bold"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload MP3
          </Button>
        </div>
      </div>

      {/* Hidden file input for Import — accepts audio + JSON (playlists) */}
      <input
        ref={importInputRef}
        type="file"
        accept="audio/*,.json"
        multiple
        className="hidden"
        onChange={async (e) => {
          if (e.target.files && e.target.files.length > 0) {
            // Separate audio files from JSON files
            const audioFiles: File[] = [];
            let playlistsJsonFile: File | null = null;

            for (const file of Array.from(e.target.files)) {
              if (file.name === "playlists-export.json" || file.type === "application/json") {
                playlistsJsonFile = file;
              } else if (file.type.startsWith("audio/")) {
                audioFiles.push(file);
              }
            }

            // Import audio files
            let trackCount = 0;
            if (audioFiles.length > 0) {
              const fileList = audioFiles as unknown as FileList;
              trackCount = await importTracksFromFiles(fileList, (fileName) => {
                const match = fileName.match(/^L(\d+)(?:-W(\d+))?(?:-([a-z-]+))?_(.+)$/);
                if (match) {
                  return {
                    level: parseInt(match[1]),
                    week: match[2] ? parseInt(match[2]) : undefined,
                    subcat: match[3] || undefined,
                    name: match[4].replace(/\.[^/.]+$/, ""),
                  };
                }
                return {
                  level: uploadLevel,
                  name: fileName.replace(/\.[^/.]+$/, ""),
                };
              });
              await loadTracks();
            }

            // Import playlists from JSON
            let playlistCount = 0;
            if (playlistsJsonFile) {
              try {
                const text = await playlistsJsonFile.text();
                const playlistsData = JSON.parse(text) as { name: string; filenames: string[] }[];

                // Build a map of filename → trackId (using ALL tracks now in DB)
                const allTracksNow = await dbGetAllTracks();
                const filenameToTrackId: Record<string, string> = {};
                for (const t of allTracksNow) {
                  const prefix = `L${t.level}${t.week ? `-W${t.week}` : ""}${t.subcat ? `-${t.subcat}` : ""}`;
                  filenameToTrackId[`${prefix}_${t.fileName}`] = t.id;
                }

                // Recreate each playlist
                for (const plData of playlistsData) {
                  const trackIds = plData.filenames
                    .map(fn => filenameToTrackId[fn])
                    .filter(Boolean);
                  if (trackIds.length > 0) {
                    const playlist: Playlist = {
                      id: `playlist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                      name: plData.name,
                      trackIds,
                      createdAt: Date.now(),
                    };
                    await dbSavePlaylist(playlist);
                    playlistCount++;
                  }
                }
                await loadPlaylists();
              } catch (err) {
                console.error("Failed to import playlists:", err);
              }
            }

            const msg = [
              trackCount > 0 ? `✅ ${trackCount} track(s) imported` : null,
              playlistCount > 0 ? `✅ ${playlistCount} playlist(s) imported` : null,
            ].filter(Boolean).join("\n") || "No files imported";

            alert(msg + (playlistsJsonFile && playlistCount === 0 ? "\n\nNote: Playlists JSON found but no matching tracks. Import audio files first." : ""));
            if (e.target) e.target.value = "";
          }
        }}
      />

      {/* Upload panel */}
      {showUpload && (
        <div className="w-full max-w-5xl p-5 rounded-2xl bg-black/40 border border-emerald-400/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Upload className="h-4 w-4 text-emerald-300" />
              Upload Audio Files
            </h3>
            <button onClick={() => setShowUpload(false)} className="text-white/40 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Level selector */}
          <div className="mb-4">
            <p className="text-xs text-white/60 mb-2 font-semibold uppercase tracking-wider">Curriculum Level:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {LEVELS.map(l => (
                <button
                  key={l.id}
                  onClick={() => setUploadLevel(l.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left",
                    uploadLevel === l.id
                      ? "bg-white text-slate-900 border-white scale-105 shadow-lg"
                      : "bg-white/10 text-white border-white/25 hover:bg-white/20"
                  )}
                >
                  <span>{l.emoji}</span>
                  <span className="truncate">{l.short}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Week selector (only for levels 1-9) */}
          {LEVELS[uploadLevel - 1]?.hasWeeks && (
            <div className="mb-4">
              <p className="text-xs text-white/60 mb-2 font-semibold uppercase tracking-wider">
                Week (1-40) — optional:
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={uploadWeek}
                  onChange={e => {
                    const v = e.target.value;
                    setUploadWeek(v === "" ? "" : Math.max(1, Math.min(40, parseInt(v))));
                  }}
                  placeholder="e.g. 5"
                  className="w-24 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-white/40 outline-none text-center"
                />
                <span className="text-xs text-white/40">Leave empty for "General" (no specific week)</span>
                {uploadWeek !== "" && (
                  <button
                    onClick={() => setUploadWeek("")}
                    className="text-xs text-white/50 hover:text-white underline"
                  >
                    Clear week
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Sub-category selector (only for Level 13 - Events) */}
          {uploadLevel === 13 && (
            <div className="mb-4">
              <p className="text-xs text-white/60 mb-2 font-semibold uppercase tracking-wider">Event Type:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EVENT_SUBCATS.map(sc => (
                  <button
                    key={sc.id}
                    onClick={() => setUploadSubcat(uploadSubcat === sc.id ? "" : sc.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left",
                      uploadSubcat === sc.id
                        ? "bg-white text-slate-900 border-white scale-105 shadow-lg"
                        : "bg-white/10 text-white border-white/25 hover:bg-white/20"
                    )}
                  >
                    <span>{sc.emoji}</span>
                    <span>{sc.name}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/40 mt-1">Leave unselected for "General" events</p>
            </div>
          )}

          {/* Unit name (optional) */}
          <div className="mb-4">
            <p className="text-xs text-white/60 mb-2 font-semibold uppercase tracking-wider">Unit / Lesson (optional):</p>
            <input
              type="text"
              value={uploadUnit}
              onChange={e => setUploadUnit(e.target.value)}
              placeholder="e.g. Unit 1, Greetings, Colors..."
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-white/40 outline-none"
            />
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={e => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files && !uploading) handleFileUpload(e.dataTransfer.files);
            }}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
              uploading
                ? "border-amber-400/60 bg-amber-500/5 cursor-wait"
                : "border-emerald-400/40 hover:bg-emerald-500/5"
            )}
          >
            {uploading ? (
              <>
                <div className="text-4xl mb-3 animate-spin">⏳</div>
                <p className="text-sm font-bold text-white">Uploading...</p>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-emerald-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-white">Drop MP3 files here or click to browse</p>
                <p className="text-xs text-white/50 mt-1">MP3, WAV, M4A, OGG · Stored offline in your browser</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              className="hidden"
              onChange={e => { if (e.target.files) handleFileUpload(e.target.files); }}
            />
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="w-full max-w-5xl flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
        <Search className="h-4 w-4 text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search tracks, units, levels..."
          className="flex-1 bg-transparent text-white text-sm placeholder:text-white/40 outline-none"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="text-white/40 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ===== Playlist Builder Panel ===== */}
      {showPlaylistBuilder && (
        <div className="w-full max-w-5xl p-5 rounded-2xl bg-black/40 border border-indigo-400/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <List className="h-4 w-4 text-indigo-300" />
              Create Playlist — Select tracks below ({selectedTrackIds.size} selected)
            </h3>
            <button onClick={() => setShowPlaylistBuilder(false)} className="text-white/40 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Saved playlists */}
          {playlists.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-white/60 mb-2 font-semibold uppercase tracking-wider">Saved Playlists:</p>
              <div className="space-y-2">
                {playlists.map(pl => (
                  <div key={pl.id} className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                    {/* Playlist header */}
                    <div
                      onClick={() => setExpandedPlaylist(expandedPlaylist === pl.id ? null : pl.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedPlaylist(expandedPlaylist === pl.id ? null : pl.id); } }}
                      className="flex items-center justify-between gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2">
                        {expandedPlaylist === pl.id ? <ChevronDown className="h-4 w-4 text-white/60" /> : <ChevronRight className="h-4 w-4 text-white/60" />}
                        <span className="text-sm font-bold text-white">📋 {pl.name}</span>
                        <span className="text-xs text-white/40">{pl.trackIds.length} track{pl.trackIds.length !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePlayPlaylist(pl); }}
                          className="px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1"
                          title="Play playlist"
                        >
                          <Play className="h-3 w-3 fill-current" /> Play
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeletePlaylist(pl.id); }}
                          className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded"
                          title="Delete playlist"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {/* Expanded playlist tracks */}
                    {expandedPlaylist === pl.id && (
                      <div className="divide-y divide-white/5">
                        {pl.trackIds.map((tid, idx) => {
                          const t = tracks.find(tr => tr.id === tid);
                          if (!t) return (
                            <div key={idx} className="px-4 py-2 text-xs text-red-400">
                              ⚠ Track not found (may have been deleted)
                            </div>
                          );
                          return (
                            <div key={tid} className="flex items-center gap-2 px-4 py-2 group">
                              <span className="text-xs text-white/40 w-6">{idx + 1}.</span>
                              <span className="text-sm text-white flex-1 truncate">{t.name}</span>
                              <span className="text-xs text-white/40">{LEVELS[t.level - 1]?.short}</span>
                              <button
                                onClick={() => handleRemoveFromPlaylist(pl, tid)}
                                className="p-1 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100"
                                title="Remove from playlist"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Track selector grid */}
          <div className="mb-4">
            <p className="text-xs text-white/60 mb-2 font-semibold uppercase tracking-wider">Select tracks to add:</p>
            <div className="max-h-64 overflow-y-auto rounded-xl bg-black/20 border border-white/10 divide-y divide-white/5">
              {tracks.map(t => {
                const isSelected = selectedTrackIds.has(t.id);
                return (
                  <div
                    key={t.id}
                    onClick={() => toggleTrackSelection(t.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleTrackSelection(t.id); } }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 cursor-pointer transition-all",
                      isSelected ? "bg-indigo-500/20" : "hover:bg-white/5"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0",
                      isSelected ? "bg-indigo-500 border-indigo-400" : "border-white/30"
                    )}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className={cn("text-sm flex-1 truncate", isSelected ? "text-indigo-300" : "text-white")}>{t.name}</span>
                    <span className="text-xs text-white/40">{LEVELS[t.level - 1]?.short}{t.week ? ` W${t.week}` : ""}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Name + Create button */}
          <div className="flex gap-2">
            <input
              type="text"
              value={playlistName}
              onChange={e => setPlaylistName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreatePlaylist()}
              placeholder='Playlist name (e.g. "Warm-up Songs", "Lesson 5 Review")'
              className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-white/40 outline-none"
            />
            <Button onClick={handleCreatePlaylist} disabled={selectedTrackIds.size === 0} className="bg-indigo-500 hover:bg-indigo-600 text-white">
              <Save className="mr-2 h-4 w-4" /> Save Playlist
            </Button>
          </div>
        </div>
      )}

      {/* Recently uploaded tracks — always visible at top for easy access */}
      {!searchQuery && tracks.length > 0 && (
        <div className="w-full max-w-5xl">
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            <div className="px-4 py-2 bg-white/5 border-b border-white/10">
              <p className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-2">
                📋 All Tracks ({tracks.length})
                <span className="text-white/40 normal-case font-normal">— click a level below to expand</span>
              </p>
            </div>
            {/* Show all tracks in sorted order (same as level order) */}
            <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
              {tracks.map(t => renderTrack(t, tracks))}
            </div>
          </div>
        </div>
      )}

      {/* Track list — grouped by level, then by week */}
      <div className="w-full max-w-5xl space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2 animate-spin">⏳</div>
            <p className="text-white/60">Loading tracks...</p>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-white/5 border border-white/10">
            <Music className="h-12 w-12 text-white/30 mx-auto mb-3" />
            <p className="text-white/60 font-bold">
              {searchQuery ? "No tracks found" : "No audio files yet"}
            </p>
            <p className="text-white/40 text-sm mt-1">
              {searchQuery ? "Try a different search" : "Click 'Upload MP3' to add audio files"}
            </p>
          </div>
        ) : (
          LEVELS.map(level => {
            const levelTracks = tracksByLevel(level.id);
            if (levelTracks.length === 0) return null;
            const isExpanded = expandedLevel === level.id || !!searchQuery;
            const levelPlaylist = levelTracks; // play through all tracks in this level

            return (
              <div key={level.id} className="rounded-2xl overflow-hidden border border-white/10">
                {/* Level header — using div (not button) because it contains a play button inside */}
                <div
                  onClick={() => setExpandedLevel(isExpanded ? null : level.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedLevel(isExpanded ? null : level.id); } }}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r text-white font-bold transition-all cursor-pointer",
                    level.color
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{level.emoji}</span>
                    <div className="text-left">
                      <p className="text-sm">Level {level.id}: {level.name}</p>
                      <p className="text-xs text-white/70">{levelTracks.length} track{levelTracks.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Play entire level */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePlay(levelTracks[0], levelPlaylist); }}
                      className="px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-xs font-bold flex items-center gap-1"
                      title="Play entire level"
                    >
                      <Play className="h-3 w-3 fill-current" /> All
                    </button>
                    {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="bg-black/20">
                    {level.hasWeeks ? (
                      <>
                        {/* Weeks 1-40 */}
                        {Array.from({ length: WEEKS_PER_LEVEL }, (_, i) => i + 1).map(weekNum => {
                          const weekTracks = tracksByWeek(level.id, weekNum);
                          if (weekTracks.length === 0) return null;
                          const weekKey = `${level.id}-${weekNum}`;
                          const weekExpanded = expandedWeeks.has(weekKey) || !!searchQuery;
                          const weekPlaylist = weekTracks;
                          return (
                            <div key={weekKey} className="border-t border-white/5">
                              <div
                                onClick={() => toggleWeek(level.id, weekNum)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleWeek(level.id, weekNum); } }}
                                className="w-full flex items-center justify-between gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  {weekExpanded ? <ChevronDown className="h-4 w-4 text-white/60" /> : <ChevronRight className="h-4 w-4 text-white/60" />}
                                  <span className="text-xs font-bold text-white/80">Week {weekNum}</span>
                                  <span className="text-xs text-white/40">{weekTracks.length} track{weekTracks.length !== 1 ? "s" : ""}</span>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handlePlay(weekTracks[0], weekPlaylist); }}
                                  className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-[10px] font-bold flex items-center gap-1"
                                  title="Play this week"
                                >
                                  <Play className="h-2.5 w-2.5 fill-current" />
                                </button>
                              </div>
                              {weekExpanded && (
                                <div className="divide-y divide-white/5">
                                  {weekTracks.map(t => renderTrack(t, weekPlaylist))}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* General (no week) */}
                        {tracksGeneral(level.id).length > 0 && (
                          <div className="border-t border-white/5">
                            {tracksGeneral(level.id).map(t => renderTrack(t, levelPlaylist))}
                          </div>
                        )}
                      </>
                    ) : level.hasSubcats ? (
                      // Level 13 (Events): show sub-categories
                      <>
                        {EVENT_SUBCATS.map(sc => {
                          const subcatTracks = levelTracks.filter(t => t.subcat === sc.id);
                          if (subcatTracks.length === 0) return null;
                          const subcatKey = `${level.id}-${sc.id}`;
                          const subcatExpanded = expandedWeeks.has(subcatKey) || !!searchQuery;
                          const subcatPlaylist = subcatTracks;
                          return (
                            <div key={subcatKey} className="border-t border-white/5">
                              <div
                                onClick={() => toggleSubcat(level.id, sc.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSubcat(level.id, sc.id); } }}
                                className="w-full flex items-center justify-between gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  {subcatExpanded ? <ChevronDown className="h-4 w-4 text-white/60" /> : <ChevronRight className="h-4 w-4 text-white/60" />}
                                  <span className="text-base">{sc.emoji}</span>
                                  <span className="text-xs font-bold text-white/80">{sc.name}</span>
                                  <span className="text-xs text-white/40">{subcatTracks.length} track{subcatTracks.length !== 1 ? "s" : ""}</span>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handlePlay(subcatTracks[0], subcatPlaylist); }}
                                  className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-[10px] font-bold flex items-center gap-1"
                                  title={`Play ${sc.name}`}
                                >
                                  <Play className="h-2.5 w-2.5 fill-current" />
                                </button>
                              </div>
                              {subcatExpanded && (
                                <div className="divide-y divide-white/5">
                                  {subcatTracks.map(t => renderTrack(t, subcatPlaylist))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {/* General events (no subcat) */}
                        {levelTracks.filter(t => !t.subcat).length > 0 && (
                          <div className="border-t border-white/5">
                            {levelTracks.filter(t => !t.subcat).map(t => renderTrack(t, levelPlaylist))}
                          </div>
                        )}
                      </>
                    ) : (
                      // Levels 10-12: no weeks, just list tracks
                      <div className="divide-y divide-white/5">
                        {levelTracks.map(t => renderTrack(t, levelPlaylist))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ===== Player bar (sticky at bottom) ===== */}
      {currentTrack && (
        <div className="w-full max-w-5xl sticky bottom-0 z-50 p-4 rounded-2xl bg-slate-900/95 backdrop-blur-lg border border-white/15 shadow-2xl">
          <audio
            ref={audioRef}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            onEnded={onEnded}
            onPlay={onPlay}
            onPause={onPause}
          />
          <div className="flex items-center gap-3 flex-wrap">
            {/* Prev */}
            <button
              onClick={playPrev}
              className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0 hover:bg-white/20 transition-all"
              title="Previous track"
            >
              <Play className="h-4 w-4 fill-current rotate-180" />
            </button>

            {/* Skip back 10s */}
            <button
              onClick={skipBackward}
              className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0 hover:bg-white/20 transition-all text-xs font-bold"
              title="Skip back 10 seconds"
            >
              -10s
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center shrink-0 hover:scale-105 transition-all shadow-lg"
            >
              {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
            </button>

            {/* Skip forward 10s */}
            <button
              onClick={skipForward}
              className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0 hover:bg-white/20 transition-all text-xs font-bold"
              title="Skip forward 10 seconds"
            >
              +10s
            </button>

            {/* Next */}
            <button
              onClick={playNext}
              className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0 hover:bg-white/20 transition-all"
              title="Next track"
            >
              <Play className="h-4 w-4 fill-current" />
            </button>

            {/* Track info + queue position */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{currentTrack.name}</p>
              <p className="text-xs text-white/50 truncate">
                {LEVELS[currentTrack.level - 1]?.emoji} {LEVELS[currentTrack.level - 1]?.short}
                {currentTrack.week && ` · Week ${currentTrack.week}`}
                {currentTrack.unit && ` · ${currentTrack.unit}`}
                {currentPlaylist.length > 1 && ` · Track ${currentIndex + 1} of ${currentPlaylist.length}`}
              </p>
            </div>

            {/* Seek bar */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
              <span className="text-xs text-white/50 font-mono tabular-nums">{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1.5 rounded-full appearance-none bg-white/20 cursor-pointer accent-purple-500"
              />
              <span className="text-xs text-white/50 font-mono tabular-nums">{formatTime(duration)}</span>
            </div>

            {/* Sleep timer */}
            <button
              onClick={toggleSleepTimer}
              className={cn(
                "h-10 px-3 rounded-full flex items-center gap-1.5 shrink-0 transition-all text-xs font-bold",
                sleepTimer === null
                  ? "bg-white/10 text-white/50 hover:bg-white/20"
                  : "bg-blue-500 text-white"
              )}
              title={`Sleep timer: ${sleepTimer === null ? "Off" : `${sleepTimerRemaining} min remaining`}`}
            >
              <span>⏰</span>
              {sleepTimer === null ? "Off" : `${sleepTimerRemaining}m`}
            </button>

            {/* Download current track */}
            <button
              onClick={downloadCurrentTrack}
              className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0 hover:bg-white/20 transition-all"
              title="Download this track"
            >
              <Download className="h-4 w-4" />
            </button>

            {/* Play mode: normal → repeat-one → repeat-all → shuffle */}
            <button
              onClick={cyclePlayMode}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all",
                playMode === "normal"
                  ? "bg-white/10 text-white/50 hover:bg-white/20"
                  : "bg-purple-500 text-white"
              )}
              title={`Mode: ${playMode}`}
            >
              {playMode === "repeat-one" ? <Repeat1 className="h-4 w-4" /> :
               playMode === "shuffle" ? <Shuffle className="h-4 w-4" /> :
               <Repeat className="h-4 w-4" />}
            </button>

            {/* Speed control */}
            <button
              onClick={handleSpeedChange}
              className={cn(
                "px-3 h-10 rounded-full flex items-center gap-1.5 shrink-0 transition-all text-xs font-bold",
                speed === 1
                  ? "bg-white/10 text-white/50 hover:bg-white/20"
                  : "bg-amber-500 text-white"
              )}
              title={`Playback speed: ${speed}x`}
            >
              <Gauge className="h-3.5 w-3.5" />
              {speed}x
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 shrink-0">
              <Volume2 className="h-4 w-4 text-white/50" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1.5 rounded-full appearance-none bg-white/20 cursor-pointer accent-purple-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Footer info */}
      <p className="text-xs text-white/40 text-center max-w-md">
        📦 All audio files stored locally in your browser (IndexedDB).
        Works fully offline. Files persist across sessions.
      </p>
    </div>
  );
}
