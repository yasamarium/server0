import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Search,
  Plus,
  Trash2,
  Edit,
  Music,
  ArrowLeft,
  Settings,
  Upload,
  Loader2,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  X,
  Sparkles,
  Download,
  ListPlus,
  FolderPlus,
  Disc,
  Repeat,
  Shuffle,
  Radio,
  Layers
} from "lucide-react";

export const Route = createFileRoute("/cloudify")({
  head: () => ({
    meta: [
      { title: "Cloudify — Premium Cloud Music Player & Playlists" },
      { name: "description", content: "Stream, search online music, create custom local playlists, and discover independent releases." },
    ],
  }),
  component: CloudifyMusicPage,
});

interface Song {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  createdAt: string;
}

interface Playlist {
  id: string;
  name: string;
  createdAt: string;
  songs: Song[];
}

const getAvatarColor = (title: string) => {
  const colors = ["#ec4899", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

function CloudifyMusicPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"library" | "search" | "playlists">("library");

  // Local Playlists State
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [playlistToAddTo, setPlaylistToAddTo] = useState<Song | null>(null);

  // Online Search States
  const [onlineResult, setOnlineResult] = useState<any>(null);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [onlineError, setOnlineError] = useState<string | null>(null);

  // Admin Mode States
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminToken, setAdminToken] = useState("");

  // Upload Form States
  const [newTitle, setNewTitle] = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverSource, setCoverSource] = useState<"file" | "url">("file");
  const [coverUrlInput, setCoverUrlInput] = useState("");
  const [audioSource, setAudioSource] = useState<"file" | "url">("file");
  const [audioUrlInput, setAudioUrlInput] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Edit Form States
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const [updating, setUpdating] = useState(false);

  // Audio Player & Queue States
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [activeQueue, setActiveQueue] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [expandedPlayer, setExpandedPlayer] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  // Load Initial Songs & Local Playlists
  useEffect(() => {
    fetchSongs();
    
    // Load local playlists from localStorage
    const savedPlaylists = localStorage.getItem("cloudify_local_playlists");
    if (savedPlaylists) {
      try {
        setPlaylists(JSON.parse(savedPlaylists));
      } catch (e) {
        console.error("Failed to parse local playlists:", e);
      }
    }

    // Check if admin token is saved in localStorage
    const savedToken = localStorage.getItem("cloudify_admin_token");
    if (savedToken === "as@vercel") {
      setIsAdmin(true);
      setAdminToken("as@vercel");
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Save Playlists to localStorage
  const savePlaylists = (updated: Playlist[]) => {
    setPlaylists(updated);
    localStorage.setItem("cloudify_local_playlists", JSON.stringify(updated));
  };

  // Clear online search when search input is empty
  useEffect(() => {
    if (!searchQuery.trim()) {
      setOnlineResult(null);
      setOnlineError(null);
    }
  }, [searchQuery]);

  // Audio Event Listeners & Queue auto-next
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      audioRef.current.addEventListener("ended", () => {
        handleNextSong();
      });
      
      audioRef.current.addEventListener("loadedmetadata", () => {
        if (audioRef.current) setDuration(audioRef.current.duration);
      });
    }

    if (currentSong) {
      const prevSrc = audioRef.current.src;
      if (prevSrc !== currentSong.audioUrl) {
        audioRef.current.src = currentSong.audioUrl;
        audioRef.current.load();
      }
      
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio playback error:", e));
        startProgressTimer();
      } else {
        audioRef.current.pause();
        stopProgressTimer();
      }
    } else {
      audioRef.current.pause();
      stopProgressTimer();
    }
  }, [currentSong, isPlaying]);

  // Sync activeQueue with songs library when songs update and queue is empty
  useEffect(() => {
    if (songs.length > 0 && activeQueue.length === 0) {
      setActiveQueue(songs);
    }
  }, [songs]);

  // Volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const startProgressTimer = () => {
    stopProgressTimer();
    progressIntervalRef.current = window.setInterval(() => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    }, 250);
  };

  const stopProgressTimer = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const fetchSongs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cloudify/songs");
      if (res.ok) {
        const data = await res.json();
        setSongs(data.songs || []);
      }
    } catch (e) {
      console.error("Failed to load songs:", e);
    } finally {
      setLoading(false);
    }
  };

  // Local Playlist Actions
  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    const newPl: Playlist = {
      id: `pl_${Date.now()}`,
      name: newPlaylistName.trim(),
      createdAt: new Date().toISOString(),
      songs: [],
    };

    const updated = [newPl, ...playlists];
    savePlaylists(updated);
    setNewPlaylistName("");
    setShowCreatePlaylistModal(false);
    
    // If adding a song right away
    if (playlistToAddTo) {
      handleAddSongToPlaylist(newPl.id, playlistToAddTo);
      setPlaylistToAddTo(null);
    }
  };

  const handleDeletePlaylist = (playlistId: string) => {
    if (!confirm("Are you sure you want to delete this playlist?")) return;
    const updated = playlists.filter(p => p.id !== playlistId);
    savePlaylists(updated);
    if (selectedPlaylist?.id === playlistId) {
      setSelectedPlaylist(null);
    }
  };

  const handleAddSongToPlaylist = (playlistId: string, song: Song) => {
    const updated = playlists.map(p => {
      if (p.id === playlistId) {
        if (p.songs.some(s => s.id === song.id || s.audioUrl === song.audioUrl)) {
          alert("Song is already in this playlist!");
          return p;
        }
        return { ...p, songs: [song, ...p.songs] };
      }
      return p;
    });

    savePlaylists(updated);
    setPlaylistToAddTo(null);
    
    // Update selectedPlaylist if currently open
    if (selectedPlaylist && selectedPlaylist.id === playlistId) {
      const target = updated.find(p => p.id === playlistId);
      if (target) setSelectedPlaylist(target);
    }

    alert(`Added "${song.title}" to playlist!`);
  };

  const handleRemoveSongFromPlaylist = (playlistId: string, songId: string) => {
    const updated = playlists.map(p => {
      if (p.id === playlistId) {
        return { ...p, songs: p.songs.filter(s => s.id !== songId) };
      }
      return p;
    });

    savePlaylists(updated);
    if (selectedPlaylist && selectedPlaylist.id === playlistId) {
      const target = updated.find(p => p.id === playlistId);
      if (target) setSelectedPlaylist(target);
    }
  };

  const handlePlayPlaylist = (playlist: Playlist, startIndex = 0) => {
    if (playlist.songs.length === 0) {
      alert("This playlist has no songs yet!");
      return;
    }

    setActiveQueue(playlist.songs);
    setCurrentSong(playlist.songs[startIndex]);
    setIsPlaying(true);
  };

  // Online Search Actions
  const playOnlineSong = () => {
    if (!onlineResult) return;
    
    const tempSong: Song = {
      id: `online_${Date.now()}`,
      title: onlineResult.title,
      artist: "YouTube Music",
      coverUrl: onlineResult.thumbnail,
      audioUrl: onlineResult.download_url,
      createdAt: new Date().toISOString()
    };
    
    setCurrentSong(tempSong);
    setIsPlaying(true);
  };

  const addOnlineSongToLibrary = async () => {
    if (!onlineResult || !isAdmin) return;
    
    const titleArtist = onlineResult.title.split(" - ");
    const artist = titleArtist[0] || "Unknown";
    const title = titleArtist[1] || onlineResult.title;

    try {
      const res = await fetch("/api/cloudify/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          artist: artist.trim(),
          coverUrl: onlineResult.thumbnail,
          audioUrl: onlineResult.download_url,
          auth: adminToken,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to add song to database.");

      alert("Song added to library successfully!");
      fetchSongs();
    } catch (err: any) {
      alert(err.message || "Failed to add song to library.");
    }
  };

  const formatViews = (num: number) => {
    if (!num) return "0";
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    if (query === "as@vercel") {
      setIsAdmin(true);
      setAdminToken("as@vercel");
      localStorage.setItem("cloudify_admin_token", "as@vercel");
      setShowAdminPanel(true);
      setSearchQuery("");
      alert("Admin Panel Unlocked!");
      return;
    }

    setActiveTab("search");

    // Perform online API lookup
    setOnlineLoading(true);
    setOnlineError(null);
    setOnlineResult(null);

    try {
      const res = await fetch(`/api/cloudify/search?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search service failed. Please check network/query.");
      
      const data = await res.json();
      if (data.status && data.result) {
        setOnlineResult(data.result);
      } else {
        setOnlineError("No matching track found online. Try adjusting query.");
      }
    } catch (err: any) {
      setOnlineError(err.message || "Failed to query track online.");
    } finally {
      setOnlineLoading(false);
    }
  };

  // Audio Playback Helpers
  const handlePlaySong = (song: Song, queueContext?: Song[]) => {
    if (queueContext && queueContext.length > 0) {
      setActiveQueue(queueContext);
    }
    if (currentSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
    }
  };

  const handleNextSong = () => {
    const queue = activeQueue.length > 0 ? activeQueue : songs;
    if (queue.length === 0 || !currentSong) return;

    if (isRepeat && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      return;
    }

    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      setCurrentSong(queue[randomIndex]);
      setIsPlaying(true);
      return;
    }

    const currentIndex = queue.findIndex(s => s.id === currentSong.id || s.audioUrl === currentSong.audioUrl);
    if (currentIndex === -1) {
      setCurrentSong(queue[0]);
    } else {
      const nextIndex = (currentIndex + 1) % queue.length;
      setCurrentSong(queue[nextIndex]);
    }
    setIsPlaying(true);
  };

  const handlePrevSong = () => {
    const queue = activeQueue.length > 0 ? activeQueue : songs;
    if (queue.length === 0 || !currentSong) return;

    const currentIndex = queue.findIndex(s => s.id === currentSong.id || s.audioUrl === currentSong.audioUrl);
    if (currentIndex === -1) {
      setCurrentSong(queue[0]);
    } else {
      let prevIndex = currentIndex - 1;
      if (prevIndex < 0) prevIndex = queue.length - 1;
      setCurrentSong(queue[prevIndex]);
    }
    setIsPlaying(true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  // Upload Song Helper
  const uploadToCloudStorage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/public/upload", {
      method: "POST",
      body: formData,
    });

    let data;
    try {
      data = await res.json();
    } catch (e) {
      if (res.status === 413) {
        throw new Error(`File "${file.name}" is too large. Server rejected upload.`);
      }
      throw new Error(`Upload failed (${res.status}). Server returned non-JSON response.`);
    }

    if (!res.ok || !data.success) throw new Error(data.error || "Upload failed");
    return data.url;
  };

  const handleUploadSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newArtist.trim()) {
      setUploadError("Please fill Title and Artist name.");
      return;
    }

    if (coverSource === "file" && !coverFile) {
      setUploadError("Please select a Cover Image file.");
      return;
    }
    if (coverSource === "url" && !coverUrlInput.trim()) {
      setUploadError("Please enter a Cover Image URL.");
      return;
    }

    if (audioSource === "file" && !audioFile) {
      setUploadError("Please select an Audio file.");
      return;
    }
    if (audioSource === "url" && !audioUrlInput.trim()) {
      setUploadError("Please enter an Audio URL.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadProgress(10);

    try {
      let coverUrl = "";
      if (coverSource === "file") {
        setUploadProgress(30);
        coverUrl = await uploadToCloudStorage(coverFile!);
      } else {
        coverUrl = coverUrlInput.trim();
      }

      let audioUrl = "";
      if (audioSource === "file") {
        setUploadProgress(60);
        audioUrl = await uploadToCloudStorage(audioFile!);
      } else {
        audioUrl = audioUrlInput.trim();
      }

      setUploadProgress(85);

      const res = await fetch("/api/cloudify/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          artist: newArtist.trim(),
          coverUrl,
          audioUrl,
          auth: adminToken,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to create db song entry.");

      setUploadProgress(100);
      setNewTitle("");
      setNewArtist("");
      setCoverFile(null);
      setAudioFile(null);
      setCoverUrlInput("");
      setAudioUrlInput("");
      setCoverSource("file");
      setAudioSource("file");
      fetchSongs();
      alert("Song uploaded successfully!");
      setShowAdminPanel(false);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload song.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteSong = async (id: string) => {
    if (!confirm("Are you sure you want to delete this song?")) return;

    try {
      const res = await fetch("/api/cloudify/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          auth: adminToken,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Delete failed.");

      if (currentSong?.id === id) {
        setIsPlaying(false);
        setCurrentSong(null);
      }
      fetchSongs();
      alert("Song deleted successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to delete song.");
    }
  };

  const handleEditSong = (song: Song) => {
    setEditingSong(song);
    setEditTitle(song.title);
    setEditArtist(song.artist);
  };

  const handleUpdateSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSong || !editTitle.trim() || !editArtist.trim()) return;

    setUpdating(true);
    try {
      const res = await fetch("/api/cloudify/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingSong.id,
          title: editTitle.trim(),
          artist: editArtist.trim(),
          auth: adminToken,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Edit failed.");

      setEditingSong(null);
      fetchSongs();
      alert("Song updated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to update song details.");
    } finally {
      setUpdating(false);
    }
  };

  const filteredSongs = songs.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#000000] text-white flex flex-col font-sans relative overflow-hidden select-none pb-28">
      {/* Header */}
      <header className="px-5 py-4 border-b border-zinc-800/80 backdrop-blur-2xl sticky top-0 z-40 bg-[#000000]/95 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="size-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 active:scale-95 transition-all text-white"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
              <Music className="size-4.5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">
                Cloudify Music
              </h1>
              <p className="text-[10px] text-zinc-400 font-mono">Stream & Manage Audio Library</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowAdminPanel(true)}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-semibold hover:bg-zinc-800 transition-all flex items-center gap-1.5"
            >
              <Settings className="size-3.5" />
              <span>Admin Panel</span>
            </button>
          )}
          <span className="text-[10px] font-mono font-bold text-zinc-300 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg uppercase tracking-wider">
            AUDIO ENGINE
          </span>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 overflow-y-auto">

        {/* Navigation Tabs Header */}
        <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-1.5 bg-[#09090b] p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => { setActiveTab("library"); setSelectedPlaylist(null); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all flex items-center gap-1.5 ${
                activeTab === "library" && !selectedPlaylist
                  ? "bg-white text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Music className="size-3.5" />
              <span>Library</span>
              <span className="text-[10px] opacity-70 font-mono ml-0.5">({songs.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab("playlists"); setSelectedPlaylist(null); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all flex items-center gap-1.5 ${
                activeTab === "playlists" || selectedPlaylist
                  ? "bg-white text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Layers className="size-3.5" />
              <span>Playlists</span>
              <span className="text-[10px] opacity-70 font-mono ml-0.5">({playlists.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab("search"); setSelectedPlaylist(null); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all flex items-center gap-1.5 ${
                activeTab === "search"
                  ? "bg-white text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Search className="size-3.5" />
              <span>Search Online</span>
            </button>
          </div>

          {/* Quick Create Playlist Button */}
          <button
            onClick={() => {
              setPlaylistToAddTo(null);
              setShowCreatePlaylistModal(true);
            }}
            className="px-3.5 h-9 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-pink-400 hover:text-pink-300 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
          >
            <FolderPlus className="size-4" />
            <span className="hidden sm:inline">New Playlist</span>
          </button>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="relative select-none max-w-xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 size-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search local library or search YouTube Music..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9.5 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl pl-10 pr-4 text-[12.5px] font-bold text-white placeholder-zinc-500 outline-none focus:border-pink-500/50 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-zinc-500 hover:text-white"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={onlineLoading || !searchQuery.trim()}
            className="px-4.5 h-9.5 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-40 text-[11.5px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-pink-600/20 flex-shrink-0 active:scale-95"
          >
            {onlineLoading ? <Loader2 className="size-3.5 animate-spin" /> : "Search Online"}
          </button>
        </form>

        {/* ───────────────── ONLINE SEARCH TAB / RESULTS ───────────────── */}
        {(activeTab === "search" || onlineLoading || onlineResult || onlineError) && (
          <div className="space-y-4">
            {onlineLoading && (
              <div className="flex flex-col items-center justify-center py-10 select-none">
                <Loader2 className="size-7 animate-spin text-pink-500" />
                <p className="text-[12px] text-zinc-400 font-bold mt-2 animate-pulse">Searching YouTube Music...</p>
              </div>
            )}

            {onlineError && (
              <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 text-rose-400 text-[12px] font-bold p-4 flex items-start gap-2.5 max-w-xl mx-auto select-text">
                <AlertCircle className="size-4.5 flex-shrink-0 mt-0.5" />
                <span>{onlineError}</span>
              </div>
            )}

            {onlineResult && (
              <div className="bg-gradient-to-br from-zinc-950/95 via-zinc-900/90 to-zinc-950/95 border border-pink-500/25 rounded-3xl p-5 max-w-xl mx-auto shadow-2xl relative overflow-hidden animate-spring-scale select-text">
                <div className="absolute -top-12 -right-12 size-28 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between mb-3.5 select-none">
                  <div className="flex items-center gap-1.5 text-[9.5px] font-black uppercase text-pink-400 tracking-widest">
                    <Sparkles className="size-4 text-pink-500" />
                    <span>YouTube Search Match</span>
                  </div>
                  <span className="text-[9px] bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded-full font-bold border border-pink-500/20">
                    Direct MP3 Stream
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Thumbnail */}
                  <div className="relative rounded-2xl overflow-hidden aspect-video sm:w-[160px] bg-zinc-900 shadow-lg flex-shrink-0 select-none group border border-zinc-800">
                    <img src={onlineResult.thumbnail} className="w-full h-full object-cover" alt="Song Thumbnail" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer" onClick={playOnlineSong}>
                      <div className="size-11 rounded-full bg-white text-black flex items-center justify-center shadow-xl transition-transform hover:scale-110 active:scale-95">
                        {currentSong?.audioUrl === onlineResult.download_url && isPlaying ? (
                          <Pause className="size-5 fill-black" />
                        ) : (
                          <Play className="size-5 fill-black ml-0.5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Meta Details */}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <div>
                      <h3 className="text-[13.5px] font-black text-white leading-snug break-words">
                        {onlineResult.title}
                      </h3>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10.5px] font-bold text-zinc-400 mt-1 select-none">
                        <span>{onlineResult.duration}</span>
                        <span>•</span>
                        <span>{formatViews(onlineResult.views)} views</span>
                        <span>•</span>
                        <span>{onlineResult.published}</span>
                      </div>
                    </div>

                    <div className="text-[10.5px] select-none">
                      <a
                        href={onlineResult.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-pink-400 font-bold underline transition-colors"
                      >
                        View YouTube Video ↗
                      </a>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 select-none pt-1">
                      <button
                        onClick={playOnlineSong}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-md shadow-pink-600/20"
                      >
                        {currentSong?.audioUrl === onlineResult.download_url && isPlaying ? (
                          <>
                            <Pause className="size-3.5 fill-white" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="size-3.5 fill-white ml-0.5" />
                            <span>Play Stream</span>
                          </>
                        )}
                      </button>

                      <a
                        href={onlineResult.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 hover:text-white text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Download className="size-3.5" />
                        <span>Download MP3</span>
                      </a>

                      <button
                        onClick={() => {
                          const onlineSong: Song = {
                            id: `online_${Date.now()}`,
                            title: onlineResult.title,
                            artist: "YouTube Music",
                            coverUrl: onlineResult.thumbnail,
                            audioUrl: onlineResult.download_url,
                            createdAt: new Date().toISOString()
                          };
                          setPlaylistToAddTo(onlineSong);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-pink-400 text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <ListPlus className="size-3.5" />
                        <span>+ Playlist</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={addOnlineSongToLibrary}
                          className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 active:scale-95"
                        >
                          <Plus className="size-3.5" />
                          <span>Add to DB</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ───────────────── LOCAL PLAYLISTS VIEW TAB ───────────────── */}
        {(activeTab === "playlists" || selectedPlaylist) && (
          <div className="space-y-6">
            {selectedPlaylist ? (
              // Selected Playlist Details View
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-zinc-950/60 p-4 rounded-3xl border border-zinc-900">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedPlaylist(null)}
                      className="size-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-all text-white"
                    >
                      <ArrowLeft className="size-4" />
                    </button>
                    <div>
                      <h2 className="text-[17px] font-black text-white leading-tight flex items-center gap-2">
                        {selectedPlaylist.name}
                        <span className="text-[10px] bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2 py-0.5 rounded-full font-bold">
                          {selectedPlaylist.songs.length} Tracks
                        </span>
                      </h2>
                      <p className="text-[10px] font-bold text-zinc-500 mt-0.5">Local Private Playlist</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedPlaylist.songs.length > 0 && (
                      <button
                        onClick={() => handlePlayPlaylist(selectedPlaylist, 0)}
                        className="px-4 h-9 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 shadow-md shadow-pink-600/20"
                      >
                        <Play className="size-3.5 fill-white" />
                        <span>Play All</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePlaylist(selectedPlaylist.id)}
                      className="size-9 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-500 flex items-center justify-center transition-all active:scale-95"
                      title="Delete Playlist"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Playlist Tracks List */}
                {selectedPlaylist.songs.length === 0 ? (
                  <div className="text-center py-16 border border-zinc-900/60 rounded-3xl bg-zinc-950/20 select-none">
                    <Disc className="size-10 text-zinc-700 mx-auto mb-2" />
                    <p className="text-[13px] font-black text-zinc-400">Playlist Empty</p>
                    <p className="text-[11px] text-zinc-600 max-w-xs mx-auto mt-0.5">
                      Add tracks to this playlist by clicking "+ Playlist" on any song in your library or online search.
                    </p>
                  </div>
                ) : (
                  <div className="bg-zinc-950/40 border border-zinc-900/60 rounded-3xl p-2 divide-y divide-zinc-900/40">
                    {selectedPlaylist.songs.map((song, idx) => {
                      const isCurrent = currentSong?.id === song.id;
                      return (
                        <div
                          key={song.id + idx}
                          onClick={() => handlePlaySong(song, selectedPlaylist.songs)}
                          className="flex items-center gap-3.5 p-3 cursor-pointer hover:bg-zinc-900/40 transition-all select-none group rounded-2xl"
                        >
                          <span className="text-[11px] font-bold text-zinc-600 w-5 text-center flex-shrink-0 group-hover:text-pink-500">
                            {isCurrent && isPlaying ? (
                              <span className="size-2 rounded-full bg-pink-500 inline-block animate-ping" />
                            ) : (
                              idx + 1
                            )}
                          </span>

                          <img
                            src={song.coverUrl}
                            className="size-11 rounded-xl object-cover bg-zinc-900 border border-zinc-800 shadow-sm flex-shrink-0"
                            alt="Cover"
                          />

                          <div className="flex-1 min-w-0">
                            <h4 className={`text-[13px] font-black leading-tight truncate ${isCurrent ? "text-pink-500" : "text-white"}`}>
                              {song.title}
                            </h4>
                            <p className="text-[11px] font-bold text-zinc-500 truncate mt-0.5">{song.artist}</p>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSongFromPlaylist(selectedPlaylist.id, song.id);
                            }}
                            className="size-8 rounded-xl bg-zinc-900/80 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                            title="Remove from playlist"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              // All Playlists Grid
              <div className="space-y-4">
                <div className="flex justify-between items-center select-none">
                  <h2 className="text-[15.5px] font-black tracking-tight text-zinc-400 uppercase tracking-widest pl-1">
                    My Custom Playlists
                  </h2>
                  <button
                    onClick={() => {
                      setPlaylistToAddTo(null);
                      setShowCreatePlaylistModal(true);
                    }}
                    className="px-3.5 h-8.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    <Plus className="size-3.5" />
                    <span>Create Playlist</span>
                  </button>
                </div>

                {playlists.length === 0 ? (
                  <div className="text-center py-16 border border-zinc-900/60 rounded-3xl bg-zinc-950/20 select-none">
                    <Layers className="size-10 text-zinc-700 mx-auto mb-2" />
                    <p className="text-[13.5px] font-black text-zinc-400">No Custom Playlists Yet</p>
                    <p className="text-[11px] text-zinc-600 max-w-xs mx-auto mt-0.5">
                      Create custom playlists to organize your favorite tracks locally on this device.
                    </p>
                    <button
                      onClick={() => setShowCreatePlaylistModal(true)}
                      className="mt-4 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-pink-400 text-[11.5px] font-black uppercase tracking-wider hover:bg-zinc-800 transition-all"
                    >
                      + Create First Playlist
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {playlists.map(pl => {
                      const firstCover = pl.songs[0]?.coverUrl;
                      return (
                        <div
                          key={pl.id}
                          onClick={() => setSelectedPlaylist(pl)}
                          className="group bg-gradient-to-br from-zinc-950/80 to-zinc-900/60 border border-zinc-900/80 hover:border-pink-500/30 rounded-3xl p-4 cursor-pointer hover:scale-[1.02] transition-all select-none shadow-xl flex items-center gap-3.5 relative overflow-hidden"
                        >
                          <div className="size-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-inner relative">
                            {firstCover ? (
                              <img src={firstCover} className="w-full h-full object-cover" alt="Playlist cover" />
                            ) : (
                              <Music className="size-6 text-pink-500" />
                            )}
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Play className="size-5 fill-white text-white" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-[14px] font-black text-white truncate leading-tight group-hover:text-pink-400 transition-colors">
                              {pl.name}
                            </h3>
                            <p className="text-[11px] font-bold text-zinc-500 mt-1">
                              {pl.songs.length} Tracks
                            </p>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePlaylist(pl.id);
                            }}
                            className="size-8 rounded-xl bg-zinc-900/60 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                            title="Delete Playlist"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ───────────────── LIBRARY TAB VIEW ───────────────── */}
        {activeTab === "library" && !selectedPlaylist && (
          <div className="space-y-6">
            {/* Featured Releases Grid */}
            {!searchQuery && songs.length > 0 && (
              <div className="space-y-3 select-none">
                <h2 className="text-[15.5px] font-black tracking-tight text-zinc-400 uppercase tracking-widest pl-1">
                  Featured Releases
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {songs.slice(0, 4).map(song => {
                    const isCurrent = currentSong?.id === song.id;
                    return (
                      <div
                        key={song.id}
                        onClick={() => handlePlaySong(song, songs)}
                        className="group bg-gradient-to-b from-zinc-950/80 to-zinc-900/40 border border-zinc-900/80 rounded-2xl p-3 space-y-3 cursor-pointer hover:bg-zinc-900/60 hover:border-pink-500/20 transition-all select-none hover:scale-[1.02] shadow-md relative"
                      >
                        <div className="relative rounded-xl overflow-hidden aspect-square bg-zinc-900 shadow-inner">
                          <img src={song.coverUrl} className="w-full h-full object-cover" alt="Cover" />
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <div className="size-11 rounded-full bg-white/95 text-black flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 active:scale-95">
                              {isCurrent && isPlaying ? <Pause className="size-5 fill-black" /> : <Play className="size-5 fill-black ml-0.5" />}
                            </div>
                          </div>
                          {isCurrent && isPlaying && (
                            <div className="absolute bottom-2.5 right-2.5 size-7 rounded-full bg-pink-500 flex items-center justify-center shadow-md animate-pulse">
                              <span className="size-2 rounded-full bg-white animate-ping" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-[12.5px] font-black text-white truncate leading-tight group-hover:text-pink-400 transition-colors">
                            {song.title}
                          </h4>
                          <p className="text-[10.5px] font-bold text-zinc-500 truncate mt-0.5">
                            {song.artist}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Songs List */}
            <div className="space-y-3">
              <div className="flex justify-between items-center select-none pl-1">
                <h2 className="text-[15.5px] font-black tracking-tight text-zinc-400 uppercase tracking-widest">
                  {searchQuery ? "Local Search Results" : "All Library Tracks"}
                </h2>
                <span className="text-[10px] bg-zinc-900 text-zinc-400 px-2.5 py-0.5 rounded-full font-black border border-zinc-800">
                  {filteredSongs.length} Tracks
                </span>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="size-8 animate-spin text-pink-500" />
                  <p className="text-[11.5px] text-zinc-500 font-bold mt-2 select-none">Loading Cloudify Music Library...</p>
                </div>
              ) : filteredSongs.length === 0 ? (
                <div className="text-center py-20 select-none border border-zinc-900 rounded-3xl bg-zinc-950/20">
                  <Music className="size-10 text-zinc-700 mx-auto mb-2" />
                  <p className="text-[13px] font-black text-zinc-400">Library Empty</p>
                  <p className="text-[11px] text-zinc-600 max-w-xs mx-auto mt-0.5 leading-normal">
                    {searchQuery ? "No local matches found. Click 'Search Online' above to find it on YouTube Music." : "No songs loaded in database yet."}
                  </p>
                </div>
              ) : (
                <div className="bg-zinc-950/40 border border-zinc-900/60 rounded-3xl p-2 select-text divide-y divide-zinc-900/40">
                  {filteredSongs.map((song, idx) => {
                    const isCurrent = currentSong?.id === song.id;
                    return (
                      <div
                        key={song.id}
                        onClick={() => handlePlaySong(song, filteredSongs)}
                        className="flex items-center gap-3.5 p-3 cursor-pointer hover:bg-zinc-900/40 transition-all select-none group rounded-2xl"
                      >
                        {/* Playing Status / Equalizer */}
                        <span className="text-[11px] font-bold text-zinc-600 w-5 text-center flex-shrink-0 group-hover:text-pink-500">
                          {isCurrent && isPlaying ? (
                            <span className="size-2 rounded-full bg-pink-500 inline-block animate-ping" />
                          ) : (
                            idx + 1
                          )}
                        </span>

                        {/* Cover Image */}
                        <img
                          src={song.coverUrl}
                          className="size-11 rounded-xl object-cover bg-zinc-900 border border-zinc-800 shadow-sm flex-shrink-0"
                          alt="Album Cover"
                        />

                        {/* Meta Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-[13px] font-black leading-tight truncate ${isCurrent ? "text-pink-500" : "text-white"}`}>
                            {song.title}
                          </h4>
                          <p className="text-[11px] font-bold text-zinc-500 truncate mt-0.5">{song.artist}</p>
                        </div>

                        {/* Quick Add to Playlist Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlaylistToAddTo(song);
                          }}
                          className="size-8 rounded-xl bg-zinc-900/80 hover:bg-pink-500/20 text-zinc-400 hover:text-pink-400 flex items-center justify-center transition-all active:scale-95"
                          title="Add to Playlist"
                        >
                          <ListPlus className="size-4" />
                        </button>

                        {/* Admin Actions */}
                        {isAdmin && (
                          <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => handleEditSong(song)}
                              className="size-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-95"
                              title="Edit Details"
                            >
                              <Edit className="size-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSong(song.id)}
                              className="size-8 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 flex items-center justify-center text-rose-500 transition-all active:scale-95"
                              title="Delete Track"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ───────────────── PERSISTENT BOTTOM MUSIC PLAYER BAR ───────────────── */}
      {currentSong && (
        <div 
          onClick={() => setExpandedPlayer(true)}
          className="fixed bottom-4 left-4 right-4 bg-zinc-950/90 backdrop-blur-2xl border border-zinc-800/80 rounded-[24px] p-3 shadow-2xl flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all z-40 select-none max-w-lg mx-auto"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <img src={currentSong.coverUrl} className="size-11.5 rounded-xl object-cover border border-zinc-800 shadow-md" alt="Cover" />
              {isPlaying && (
                <div className="absolute -bottom-1 -right-1 size-4 rounded-full bg-pink-500 flex items-center justify-center">
                  <span className="size-1.5 rounded-full bg-white animate-ping" />
                </div>
              )}
            </div>
            <div className="truncate">
              <h4 className="text-[12.5px] font-black text-white truncate leading-tight">{currentSong.title}</h4>
              <p className="text-[10.5px] font-bold text-pink-400 truncate mt-0.5">{currentSong.artist}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button
              onClick={handlePrevSong}
              className="size-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white active:scale-90 transition-all"
            >
              <SkipBack className="size-4.5 fill-zinc-400" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="size-10 rounded-full bg-white text-black flex items-center justify-center active:scale-90 shadow-lg transition-all"
            >
              {isPlaying ? <Pause className="size-4.5 fill-black" /> : <Play className="size-4.5 fill-black ml-0.5" />}
            </button>
            <button
              onClick={handleNextSong}
              className="size-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white active:scale-90 transition-all"
            >
              <SkipForward className="size-4.5 fill-zinc-400" />
            </button>
          </div>
        </div>
      )}

      {/* ───────────────── EXPANDED FULLSCREEN PLAYER ───────────────── */}
      {expandedPlayer && currentSong && (
        <div className="fixed inset-0 bg-[#050508] z-50 flex flex-col p-6 animate-slide-in select-text relative overflow-y-auto">
          {/* Dynamic Album Reflection */}
          <div
            className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[380px] h-[380px] rounded-full blur-[120px] opacity-35 pointer-events-none transition-all duration-1000"
            style={{ backgroundImage: `radial-gradient(circle, ${getAvatarColor(currentSong.title)} 0%, transparent 70%)` }}
          />

          {/* Header */}
          <div className="flex justify-between items-center select-none z-10 max-w-md mx-auto w-full">
            <button
              onClick={() => setExpandedPlayer(false)}
              className="size-9.5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 active:scale-90 transition-all"
            >
              <ChevronDown className="size-5 text-zinc-400" />
            </button>
            <span className="text-[10px] font-black uppercase text-pink-400 tracking-widest select-none flex items-center gap-1.5">
              <Disc className="size-3.5 animate-spin" style={{ animationDuration: '4s' }} />
              Playing Now
            </span>
            <button
              onClick={() => setPlaylistToAddTo(currentSong)}
              className="size-9.5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 text-pink-400 active:scale-90 transition-all"
              title="Add to Playlist"
            >
              <ListPlus className="size-4" />
            </button>
          </div>

          {/* Album Cover Art */}
          <div className="flex-1 flex items-center justify-center py-6 z-10">
            <div className="w-full max-w-[270px] aspect-square rounded-[28px] overflow-hidden bg-zinc-900 border border-zinc-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.85)] hover:scale-[1.01] transition-transform select-none relative">
              <img src={currentSong.coverUrl} className="w-full h-full object-cover" alt="Album Cover" />
            </div>
          </div>

          {/* Controls & Progress Panel */}
          <div className="space-y-6 pb-8 z-10 max-w-md mx-auto w-full">
            <div>
              <h3 className="text-[20px] font-black text-white leading-tight break-words">{currentSong.title}</h3>
              <p className="text-[14px] font-bold text-pink-400 mt-1">{currentSong.artist}</p>
            </div>

            {/* Seek Bar */}
            <div className="space-y-1.5 select-none">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-500 outline-none"
              />
              <div className="flex justify-between text-[10.5px] font-bold text-zinc-400">
                <span>{formatTime(currentTime)}</span>
                <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
              </div>
            </div>

            {/* Media Control Buttons */}
            <div className="flex justify-between items-center select-none px-4">
              <button
                onClick={() => setIsShuffle(!isShuffle)}
                className={`size-9 rounded-full flex items-center justify-center transition-colors ${
                  isShuffle ? "text-pink-500 bg-pink-500/10 border border-pink-500/20" : "text-zinc-500 hover:text-white"
                }`}
                title="Shuffle"
              >
                <Shuffle className="size-4.5" />
              </button>

              <button
                onClick={handlePrevSong}
                className="size-12 rounded-full flex items-center justify-center hover:bg-zinc-900 active:scale-90 transition-all text-zinc-300 hover:text-white"
              >
                <SkipBack className="size-7 fill-current" />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="size-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 shadow-xl transition-all"
              >
                {isPlaying ? <Pause className="size-7 fill-black" /> : <Play className="size-7 fill-black ml-1" />}
              </button>

              <button
                onClick={handleNextSong}
                className="size-12 rounded-full flex items-center justify-center hover:bg-zinc-900 active:scale-90 transition-all text-zinc-300 hover:text-white"
              >
                <SkipForward className="size-7 fill-current" />
              </button>

              <button
                onClick={() => setIsRepeat(!isRepeat)}
                className={`size-9 rounded-full flex items-center justify-center transition-colors ${
                  isRepeat ? "text-pink-500 bg-pink-500/10 border border-pink-500/20" : "text-zinc-500 hover:text-white"
                }`}
                title="Repeat Track"
              >
                <Repeat className="size-4.5" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-3.5 select-none pt-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX className="size-4.5" /> : <Volume2 className="size-4.5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  setIsMuted(false);
                }}
                className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-400 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ───────────────── ADD TO PLAYLIST MODAL ───────────────── */}
      {playlistToAddTo && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800/90 rounded-3xl p-6 shadow-2xl space-y-4 animate-spring-scale select-text">
            <div className="flex justify-between items-center select-none">
              <div className="flex items-center gap-2">
                <ListPlus className="size-4.5 text-pink-500" />
                <span className="text-[13px] font-black uppercase text-zinc-300 tracking-wider">Add to Playlist</span>
              </div>
              <button onClick={() => setPlaylistToAddTo(null)} className="text-zinc-500 hover:text-white">
                <X className="size-4.5" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              <img src={playlistToAddTo.coverUrl} className="size-10 rounded-xl object-cover" alt="Cover" />
              <div className="min-w-0 flex-1">
                <h4 className="text-[12.5px] font-black text-white truncate">{playlistToAddTo.title}</h4>
                <p className="text-[10px] font-bold text-zinc-500 truncate">{playlistToAddTo.artist}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Select Playlist</p>
              {playlists.length === 0 ? (
                <p className="text-[11px] text-zinc-500 italic py-2 text-center">No playlists created yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {playlists.map(pl => (
                    <button
                      key={pl.id}
                      onClick={() => handleAddSongToPlaylist(pl.id, playlistToAddTo)}
                      className="w-full p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-left text-[12px] font-bold text-white flex justify-between items-center transition-all"
                    >
                      <span className="truncate">{pl.name}</span>
                      <span className="text-[9.5px] text-zinc-500 font-normal">{pl.songs.length} tracks</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-zinc-900 flex gap-2">
              <button
                onClick={() => {
                  setShowCreatePlaylistModal(true);
                }}
                className="w-full h-9.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-[11.5px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="size-4" />
                <span>Create New Playlist</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────── CREATE PLAYLIST MODAL ───────────────── */}
      {showCreatePlaylistModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800/90 rounded-3xl p-6 shadow-2xl space-y-4 animate-spring-scale select-text">
            <div className="flex justify-between items-center select-none">
              <span className="text-[13px] font-black uppercase text-zinc-300 tracking-wider">New Playlist</span>
              <button onClick={() => setShowCreatePlaylistModal(false)} className="text-zinc-500 hover:text-white">
                <X className="size-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9.5px] font-black uppercase text-zinc-500 tracking-wider block">Playlist Name</label>
                <input
                  type="text"
                  placeholder="e.g. Chill Vibe Beats"
                  required
                  autoFocus
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full h-10 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 text-[13px] font-bold text-white outline-none focus:border-pink-500/50"
                />
              </div>

              <button
                type="submit"
                className="w-full h-10 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black text-[12px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-pink-600/20"
              >
                <FolderPlus className="size-4" />
                <span>Save Playlist</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────── ADMIN PANEL OVERLAY ───────────────── */}
      {showAdminPanel && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800/80 rounded-[28px] p-6 shadow-2xl space-y-4 animate-spring-scale select-text">
            <div className="flex justify-between items-center select-none">
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-4 text-pink-500" />
                <span className="text-[13px] font-black uppercase text-zinc-400 tracking-wider">Cloudify Admin Control</span>
              </div>
              <button
                onClick={() => {
                  setShowAdminPanel(false);
                  setUploadError(null);
                }}
                className="text-zinc-500 hover:text-white"
              >
                <X className="size-4.5" />
              </button>
            </div>

            {uploadError && (
              <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 text-rose-500 text-[12px] font-bold p-3 flex items-start gap-2">
                <AlertCircle className="size-4 flex-shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSong} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider block">Song Title</label>
                <input
                  type="text"
                  placeholder="e.g. Starboy"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-9 bg-zinc-900 border border-zinc-800/60 rounded-xl px-3 text-[12.5px] font-bold text-white outline-none focus:border-pink-500/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider block">Artist Name</label>
                <input
                  type="text"
                  placeholder="e.g. The Weeknd"
                  required
                  value={newArtist}
                  onChange={(e) => setNewArtist(e.target.value)}
                  className="w-full h-9 bg-zinc-900 border border-zinc-800/60 rounded-xl px-3 text-[12.5px] font-bold text-white outline-none focus:border-pink-500/30"
                />
              </div>

              {/* Cover Source Selector */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider block">Album Cover (Image)</label>
                <div className="grid grid-cols-2 bg-zinc-900/60 p-0.5 rounded-lg border border-zinc-800/40 select-none">
                  <button
                    type="button"
                    onClick={() => setCoverSource("file")}
                    className={`py-1 rounded-md text-[10px] font-black uppercase transition-all ${coverSource === "file" ? "bg-pink-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"}`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverSource("url")}
                    className={`py-1 rounded-md text-[10px] font-black uppercase transition-all ${coverSource === "url" ? "bg-pink-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"}`}
                  >
                    Paste URL
                  </button>
                </div>
              </div>

              {/* Cover File or URL Select */}
              {coverSource === "file" ? (
                <div className="space-y-1 select-none">
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                      className="flex-1 text-[11px] text-zinc-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-zinc-900 file:text-white hover:file:bg-zinc-800 cursor-pointer"
                    />
                    {coverFile && <CheckCircle className="size-4.5 text-emerald-500 self-center" />}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <input
                    type="url"
                    placeholder="https://example.com/cover.jpg"
                    required
                    value={coverUrlInput}
                    onChange={(e) => setCoverUrlInput(e.target.value)}
                    className="w-full h-9 bg-zinc-900 border border-zinc-800/60 rounded-xl px-3 text-[12.5px] font-bold text-white outline-none focus:border-pink-500/30"
                  />
                </div>
              )}

              {/* Audio Source Selector */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider block">Song Track (Audio)</label>
                <div className="grid grid-cols-2 bg-zinc-900/60 p-0.5 rounded-lg border border-zinc-800/40 select-none">
                  <button
                    type="button"
                    onClick={() => setAudioSource("file")}
                    className={`py-1 rounded-md text-[10px] font-black uppercase transition-all ${audioSource === "file" ? "bg-pink-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"}`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudioSource("url")}
                    className={`py-1 rounded-md text-[10px] font-black uppercase transition-all ${audioSource === "url" ? "bg-pink-600 text-white shadow-sm" : "text-zinc-400 hover:text-white"}`}
                  >
                    Paste URL
                  </button>
                </div>
              </div>

              {/* Audio File or URL Select */}
              {audioSource === "file" ? (
                <div className="space-y-1 select-none">
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="audio/*"
                      required
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                      className="flex-1 text-[11px] text-zinc-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-zinc-900 file:text-white hover:file:bg-zinc-800 cursor-pointer"
                    />
                    {audioFile && <CheckCircle className="size-4.5 text-emerald-500 self-center" />}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <input
                    type="url"
                    placeholder="https://example.com/song.mp3"
                    required
                    value={audioUrlInput}
                    onChange={(e) => setAudioUrlInput(e.target.value)}
                    className="w-full h-9 bg-zinc-900 border border-zinc-800/60 rounded-xl px-3 text-[12.5px] font-bold text-white outline-none focus:border-pink-500/30"
                  />
                </div>
              )}

              {uploading && (
                <div className="space-y-1 select-none pt-1">
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <span className="text-[9px] font-bold text-zinc-500 block text-right">Uploading CDN: {uploadProgress}%</span>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="w-full h-10 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-[12px] uppercase tracking-wider disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
              >
                {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                <span>Upload & Publish Song</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────── EDIT SONG INFO MODAL ───────────────── */}
      {editingSong && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800/80 rounded-[28px] p-6 shadow-2xl space-y-4 animate-spring-scale select-text">
            <div className="flex justify-between items-center select-none">
              <span className="text-[13px] font-black uppercase text-zinc-400 tracking-wider">Edit Song Info</span>
              <button onClick={() => setEditingSong(null)} className="text-zinc-500 hover:text-white">
                <X className="size-4.5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSong} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider block">Song Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full h-9 bg-zinc-900 border border-zinc-800/60 rounded-xl px-3 text-[12.5px] font-bold text-white outline-none focus:border-pink-500/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-zinc-500 tracking-wider block">Artist Name</label>
                <input
                  type="text"
                  required
                  value={editArtist}
                  onChange={(e) => setEditArtist(e.target.value)}
                  className="w-full h-9 bg-zinc-900 border border-zinc-800/60 rounded-xl px-3 text-[12.5px] font-bold text-white outline-none focus:border-pink-500/30"
                />
              </div>

              <button
                type="submit"
                disabled={updating}
                className="w-full h-10 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-[12px] uppercase tracking-wider disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
              >
                {updating ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle className="size-3.5" />}
                <span>Save Changes</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
