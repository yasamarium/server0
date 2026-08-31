import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle,
  Plus,
  LogIn,
  Send,
  Image,
  ArrowLeft,
  Copy,
  Check,
  Crown,
  LogOut,
  Trash2,
  Users,
  Loader2,
  AlertCircle,
  X,
  Shield,
} from "lucide-react";
import { trackGlobalActivity } from "../lib/activity";

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  media?: string | null;
  timestamp: string;
}

interface ChatRoom {
  id: string;
  name: string;
  admin: string;
  code: string;
  members: string[];
  messages: ChatMessage[];
  createdAt: string;
}

function TempChatPage() {
  // ── Lobby state ──
  const [view, setView] = useState<"lobby" | "chat">("lobby");
  const [username, setUsername] = useState("");
  const [roomName, setRoomName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [lobbyTab, setLobbyTab] = useState<"create" | "join">("create");
  const [lobbyLoading, setLobbyLoading] = useState(false);
  const [lobbyError, setLobbyError] = useState<string | null>(null);

  // ── Chat state ──
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [roomDeleted, setRoomDeleted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Scroll to bottom ──
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [room?.messages?.length, scrollToBottom]);

  // ── Restore active session on mount / refresh ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("cloud_tempchat_session");
      if (saved) {
        const { roomId, username: savedUser } = JSON.parse(saved);
        if (roomId && savedUser) {
          setUsername(savedUser);
          fetch(`/api/chat/room?roomId=${encodeURIComponent(roomId)}`)
            .then((res) => res.json())
            .then((data) => {
              if (data.success && data.room) {
                setRoom(data.room);
                setView("chat");
              } else {
                localStorage.removeItem("cloud_tempchat_session");
              }
            })
            .catch(() => {});
        }
      }
    } catch {}
  }, []);

  // ── Polling for new messages ──
  const pollRoom = useCallback(async () => {
    if (!room) return;
    try {
      const res = await fetch(`/api/chat/room?roomId=${room.id}`);
      const data = await res.json();
      if (data.success && data.room) {
        setRoom(data.room);
      } else if (!data.success && data.error?.includes("not found")) {
        // Room was deleted (admin left)
        setRoomDeleted(true);
        try { localStorage.removeItem("cloud_tempchat_session"); } catch {}
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch {}
  }, [room?.id]);

  useEffect(() => {
    if (view === "chat" && room) {
      pollRef.current = setInterval(pollRoom, 4000);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
  }, [view, room?.id, pollRoom]);

  // ── Lobby actions ──
  const handleCreate = async () => {
    if (!username.trim() || !roomName.trim()) {
      setLobbyError("Enter your name and a room name.");
      return;
    }
    setLobbyLoading(true);
    setLobbyError(null);
    try {
      const res = await fetch("/api/chat/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", roomName: roomName.trim(), username: username.trim() }),
      });
      const data = await res.json();
      if (data.success && data.room) {
        setRoom(data.room);
        setView("chat");
        try {
          localStorage.setItem(
            "cloud_tempchat_session",
            JSON.stringify({ roomId: data.room.id, username: username.trim() })
          );
        } catch {}
        trackGlobalActivity("Created TempChat Room", `Room: "${roomName.trim()}" (Code: ${data.room.code})`);
      } else {
        setLobbyError(data.error || "Failed to create room.");
      }
    } catch {
      setLobbyError("Network error.");
    }
    setLobbyLoading(false);
  };

  const handleJoin = async () => {
    if (!username.trim() || !joinCode.trim()) {
      setLobbyError("Enter your name and the room code.");
      return;
    }
    setLobbyLoading(true);
    setLobbyError(null);
    try {
      const res = await fetch("/api/chat/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", code: joinCode.trim(), username: username.trim() }),
      });
      const data = await res.json();
      if (data.success && data.room) {
        setRoom(data.room);
        setView("chat");
        try {
          localStorage.setItem(
            "cloud_tempchat_session",
            JSON.stringify({ roomId: data.room.id, username: username.trim() })
          );
        } catch {}
        trackGlobalActivity("Joined TempChat Room", `Joined room: "${data.room.name}"`);
      } else {
        setLobbyError(data.error || "Failed to join.");
      }
    } catch {
      setLobbyError("Network error.");
    }
    setLobbyLoading(false);
  };

  // ── Chat actions ──
  const handleSend = async () => {
    if (!msgText.trim() || !room) return;
    setSending(true);
    try {
      await fetch("/api/chat/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          roomId: room.id,
          sender: username.trim(),
          text: msgText.trim(),
        }),
      });
      setMsgText("");
      await pollRoom();
    } catch {}
    setSending(false);
  };

  const handleMediaUpload = async (file: File) => {
    if (!room || !file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const upRes = await fetch("/api/chat/upload", { method: "POST", body: formData });
      const data = await upRes.json();

      if (data.success && data.url) {
        await fetch("/api/chat/room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send",
            roomId: room.id,
            sender: username.trim(),
            text: file.name,
            media: data.url,
          }),
        });
        trackGlobalActivity("Uploaded Chat Media", `File: ${file.name}`);
        await pollRoom();
      }
    } catch {}
    setUploading(false);
  };

  const handleLeave = async () => {
    if (!room) return;
    try {
      await fetch("/api/chat/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave", roomId: room.id, username: username.trim() }),
      });
    } catch {}
    try { localStorage.removeItem("cloud_tempchat_session"); } catch {}
    if (pollRef.current) clearInterval(pollRef.current);
    setRoom(null);
    setView("lobby");
    setRoomDeleted(false);
  };

  const copyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const isAdmin = room?.admin === username.trim().toLowerCase();
  const lowerUser = username.trim().toLowerCase();

  // ── Room deleted overlay ──
  if (roomDeleted) {
    return (
      <main className="min-h-screen bg-background text-foreground font-sans flex items-center justify-center">
        <div className="orb orb-1" /><div className="orb orb-2" />
        <div className="text-center space-y-4 p-8 max-w-sm relative z-10">
          <div className="size-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <Trash2 className="size-7 text-red-400" />
          </div>
          <h2 className="text-[20px] font-black text-foreground">Room Deleted</h2>
          <p className="text-[13px] text-muted-foreground">The admin has left the room. All messages and data have been permanently deleted.</p>
          <button
            onClick={() => { setRoomDeleted(false); setRoom(null); setView("lobby"); }}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-[12.5px] font-bold transition-colors"
          >
            Back to Lobby
          </button>
        </div>
      </main>
    );
  }

  // ── LOBBY ──
  if (view === "lobby") {
    return (
      <main className="min-h-screen bg-background text-foreground font-sans relative">
        <div className="orb orb-1" /><div className="orb orb-2" />
        <div className="max-w-md mx-auto px-4 py-10 space-y-8 relative z-10">
          {/* Header */}
          <div className="flex items-center gap-4">
            <a href="/" className="size-10 rounded-2xl bg-secondary/30 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
              <ArrowLeft className="size-4.5" />
            </a>
            <div className="flex-1">
              <h1 className="text-[26px] font-black tracking-tight leading-tight bg-gradient-to-r from-foreground via-teal-400 to-foreground bg-clip-text text-transparent">
                TempChat
              </h1>
              <p className="text-[12px] text-muted-foreground mt-0.5">Create or join temporary chat rooms. Vanishes when admin leaves.</p>
            </div>
            <div className="size-12 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-cyan-500/20 border border-teal-500/30 flex items-center justify-center">
              <MessageCircle className="size-5.5 text-teal-400" />
            </div>
          </div>

          {/* Name input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Your Display Name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name..."
              maxLength={20}
              className="w-full px-4 py-3 rounded-2xl border border-border/50 bg-secondary/10 text-[14px] font-semibold text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-teal-500/50 transition-colors ios-glass"
            />
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-secondary/20 border border-border/30">
            <button
              onClick={() => { setLobbyTab("create"); setLobbyError(null); }}
              className={`py-2.5 text-[12px] font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${lobbyTab === "create" ? "bg-teal-600 text-white shadow-lg shadow-teal-600/30" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Plus className="size-3.5" /> Create Room
            </button>
            <button
              onClick={() => { setLobbyTab("join"); setLobbyError(null); }}
              className={`py-2.5 text-[12px] font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${lobbyTab === "join" ? "bg-teal-600 text-white shadow-lg shadow-teal-600/30" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LogIn className="size-3.5" /> Join Room
            </button>
          </div>

          {/* Form */}
          <div className="p-5 rounded-[24px] bg-secondary/10 border border-border/40 ios-glass space-y-4">
            {lobbyTab === "create" ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Room Name</label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="e.g. Chill Zone"
                    maxLength={40}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border/50 bg-background/80 text-[13px] font-semibold text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-teal-500/50 transition-colors"
                  />
                </div>
                <button
                  onClick={handleCreate}
                  disabled={lobbyLoading || !username.trim() || !roomName.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-[13px] font-black flex items-center justify-center gap-2 transition-all disabled:opacity-40 shadow-lg shadow-teal-600/20"
                >
                  {lobbyLoading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  <span>{lobbyLoading ? "Creating..." : "Create Room"}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Room Code</label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.replace(/\s/g, ""))}
                    placeholder="e.g. abc123"
                    maxLength={10}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border/50 bg-background/80 text-[13px] font-semibold text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-teal-500/50 transition-colors font-mono tracking-widest text-center"
                  />
                </div>
                <button
                  onClick={handleJoin}
                  disabled={lobbyLoading || !username.trim() || !joinCode.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-[13px] font-black flex items-center justify-center gap-2 transition-all disabled:opacity-40 shadow-lg shadow-teal-600/20"
                >
                  {lobbyLoading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
                  <span>{lobbyLoading ? "Joining..." : "Join Room"}</span>
                </button>
              </div>
            )}

            {lobbyError && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11.5px] font-semibold">
                <AlertCircle className="size-3.5 flex-shrink-0" />
                <span>{lobbyError}</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/15 space-y-2">
            <div className="flex items-center gap-2 text-teal-400 text-[11.5px] font-bold">
              <Shield className="size-3.5" /> How TempChat Works
            </div>
            <ul className="text-[11px] text-muted-foreground space-y-1 pl-5 list-disc">
              <li>Room creator becomes the <strong className="text-teal-400">Admin</strong></li>
              <li>Share the <strong>join code</strong> with others to let them in</li>
              <li>When Admin leaves, <strong className="text-red-400">entire room + all data is permanently deleted</strong></li>
              <li>Send text messages and media (images, files)</li>
            </ul>
          </div>
        </div>
      </main>
    );
  }

  // ── CHAT VIEW ──
  return (
    <main className="h-[100dvh] bg-background text-foreground font-sans flex flex-col relative overflow-hidden">
      <div className="orb orb-1" /><div className="orb orb-2" />

      {/* Chat Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border/30 bg-background/80 backdrop-blur-xl z-20 flex-shrink-0">
        <button
          onClick={handleLeave}
          className="size-9 rounded-xl bg-secondary/30 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-red-400 hover:border-red-500/30 transition-all"
          title={isAdmin ? "Leave & Delete Room" : "Leave Room"}
        >
          <LogOut className="size-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-black text-foreground truncate">{room?.name}</h2>
            {isAdmin && (
              <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/25 text-amber-400 text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5">
                <Crown className="size-2.5" /> Admin
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">{room?.members.length || 0} members online</p>
        </div>

        {/* Join code */}
        <button
          onClick={copyCode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-bold hover:bg-teal-500/20 transition-colors"
        >
          {codeCopied ? <Check className="size-3" /> : <Copy className="size-3" />}
          <span className="font-mono tracking-wider">{room?.code}</span>
        </button>

        {/* Members toggle */}
        <button
          onClick={() => setShowMembers(!showMembers)}
          className={`size-9 rounded-xl border flex items-center justify-center transition-all ${showMembers ? "bg-teal-500/20 border-teal-500/30 text-teal-400" : "bg-secondary/30 border-border/40 text-muted-foreground hover:text-foreground"}`}
        >
          <Users className="size-4" />
        </button>
      </header>

      {/* Members sidebar */}
      {showMembers && (
        <div className="absolute right-0 top-[57px] w-56 bg-background/95 backdrop-blur-xl border-l border-b border-border/30 rounded-bl-2xl z-30 p-3 space-y-1.5 animate-in slide-in-from-right">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-muted-foreground uppercase tracking-wider">Members</span>
            <button onClick={() => setShowMembers(false)} className="text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          </div>
          {room?.members.map((m) => (
            <div key={m} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-secondary/20">
              <div className="size-6 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 text-[9px] font-black">
                {m.charAt(0).toUpperCase()}
              </div>
              <span className="text-[12px] font-semibold text-foreground flex-1">{m}</span>
              {m === room.admin && <Crown className="size-3 text-amber-400" />}
            </div>
          ))}
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 z-10 scrollbar-thin">
        {room?.messages.map((msg) => {
          const isSystem = msg.sender === "system";
          const isMe = msg.sender === lowerUser;
          const isImage = msg.media && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(msg.media);
          const isVideo = msg.media && /\.(mp4|webm|mov)$/i.test(msg.media);

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center py-1">
                <span className="px-3 py-1 rounded-full bg-secondary/20 border border-border/20 text-[10px] text-muted-foreground/70 font-medium">
                  {msg.text}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] sm:max-w-[70%] md:max-w-[55%] lg:max-w-[45%] space-y-1 ${isMe ? "items-end" : "items-start"}`}>
                {!isMe && (
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="text-[10px] font-bold text-teal-400">{msg.sender}</span>
                    {msg.sender === room?.admin && <Crown className="size-2.5 text-amber-400" />}
                  </div>
                )}
                <div className={`px-3.5 py-2.5 rounded-2xl ${isMe
                    ? "bg-teal-600 text-white rounded-br-md"
                    : "bg-secondary/20 border border-border/30 text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.media && (
                    <div className="mb-2">
                      {isImage ? (
                        <img src={msg.media} alt="" className="max-w-full rounded-xl max-h-60 object-cover" loading="lazy" />
                      ) : isVideo ? (
                        <video src={msg.media} controls className="max-w-full rounded-xl max-h-60" />
                      ) : (
                        <a href={msg.media} target="_blank" rel="noopener noreferrer" className="text-[11px] underline break-all">
                          📎 {msg.text || "Attachment"}
                        </a>
                      )}
                    </div>
                  )}
                  {msg.text && !msg.media && <p className="text-[13px] leading-relaxed break-words">{msg.text}</p>}
                  {msg.text && msg.media && !isImage && !isVideo && null}
                </div>
                <span className={`text-[9px] px-1 ${isMe ? "text-muted-foreground/50 text-right" : "text-muted-foreground/50"}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-border/30 bg-background/80 backdrop-blur-xl z-20">
        <div className="flex items-center gap-2">
          {/* Media upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*,.pdf,.zip,.rar"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleMediaUpload(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="size-10 rounded-xl bg-secondary/30 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-teal-400 hover:border-teal-500/30 transition-all disabled:opacity-40 flex-shrink-0"
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Image className="size-4" />}
          </button>

          <input
            type="text"
            value={msgText}
            onChange={(e) => setMsgText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-2xl border border-border/40 bg-secondary/10 text-[13px] font-medium text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-teal-500/40 transition-colors"
          />

          <button
            onClick={handleSend}
            disabled={sending || !msgText.trim()}
            className="size-10 rounded-xl bg-teal-600 hover:bg-teal-500 text-white flex items-center justify-center transition-all disabled:opacity-30 flex-shrink-0 shadow-lg shadow-teal-600/20"
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </button>
        </div>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/tempchat")({
  component: TempChatPage,
  head: () => ({
    meta: [
      { title: "TempChat — Cloud OS Space" },
      { name: "description", content: "Create temporary chat rooms that vanish when the admin leaves. Text and media support." },
    ],
  }),
});
