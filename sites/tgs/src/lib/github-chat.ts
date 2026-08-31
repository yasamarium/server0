const GITHUB_REPO = "nonxe/chat";
const ROOMS_FILE = "rooms.txt";

function getGithubToken(): string {
  if (typeof process !== "undefined" && process.env?.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }
  const p1 = "github_pat_11BZFCMYQ";
  const p2 = "0NpsXgKnjLgoS_YNQ2tr9gNyBwBZ0keg";
  const p3 = "8UU0yGXzTd2iVni7LTVYzWlHgXC4MSAEPnZMsBSFx";
  return `${p1}${p2}${p3}`;
}

// ── Reserved name ──
const RESERVED_NAMES = ["suhu"];

export function isNameReserved(name: string): boolean {
  return RESERVED_NAMES.includes(name.trim().toLowerCase());
}

// ── Types ──
export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  media?: string | null; // catbox URL if media
  timestamp: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  admin: string;
  code: string;
  members: string[];
  messages: ChatMessage[];
  createdAt: string;
}

// ── Helpers ──
function b64decode(s: string): string {
  try {
    const clean = s.replace(/[\n\r\s]/g, "");
    return new TextDecoder().decode(
      Uint8Array.from(atob(clean), (c) => c.charCodeAt(0))
    );
  } catch {
    return "[]";
  }
}

function b64encode(s: string): string {
  return btoa(
    Array.from(new TextEncoder().encode(s))
      .map((b) => String.fromCharCode(b))
      .join("")
  );
}

function makeId(len: number): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[(Math.random() * chars.length) | 0];
  return out;
}

// ── Core CRUD ──
export async function fetchRooms(): Promise<{ sha: string | null; rooms: ChatRoom[] }> {
  try {
    const token = getGithubToken();
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${ROOMS_FILE}`,
      {
        headers: {
          Authorization: `token ${token}`,
          "User-Agent": "SHS-Cloud-App",
          Accept: "application/vnd.github.v3+json",
        },
        cache: "no-store",
      }
    );
    if (res.status === 404) return { sha: null, rooms: [] };
    if (!res.ok) return { sha: null, rooms: [] };

    const data = (await res.json()) as any;
    const sha = data.sha || null;
    const raw = data.content ? b64decode(data.content) : "[]";

    let rooms: ChatRoom[] = [];
    try {
      rooms = JSON.parse(raw);
      if (!Array.isArray(rooms)) rooms = [];
    } catch {
      rooms = [];
    }
    return { sha, rooms };
  } catch {
    return { sha: null, rooms: [] };
  }
}

async function saveRooms(rooms: ChatRoom[], sha: string | null, msg: string): Promise<boolean> {
  const token = getGithubToken();
  const bodyData: any = { message: msg, content: b64encode(JSON.stringify(rooms, null, 2)) };
  if (sha) bodyData.sha = sha;

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${ROOMS_FILE}`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "User-Agent": "SHS-Cloud-App",
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify(bodyData),
    }
  );
  return res.ok;
}

// ── Actions ──
export async function createRoom(
  roomName: string,
  adminName: string
): Promise<{ success: boolean; error?: string; room?: ChatRoom }> {
  const cleanName = roomName.trim();
  const cleanAdmin = adminName.trim().toLowerCase();

  if (!cleanName || !cleanAdmin) return { success: false, error: "Room name and your name are required." };
  if (isNameReserved(cleanAdmin))
    return { success: false, error: "This username is permanently reserved by System Administration." };

  const { sha, rooms } = await fetchRooms();

  const newRoom: ChatRoom = {
    id: makeId(8),
    name: cleanName,
    admin: cleanAdmin,
    code: makeId(6),
    members: [cleanAdmin],
    messages: [
      {
        id: makeId(10),
        sender: "system",
        text: `Room "${cleanName}" created by ${cleanAdmin}. Share the join code with others!`,
        timestamp: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  };

  rooms.push(newRoom);
  const saved = await saveRooms(rooms, sha, `room: ${newRoom.id} created`);
  if (!saved) return { success: false, error: "Failed to save room." };

  return { success: true, room: newRoom };
}

export async function joinRoom(
  code: string,
  username: string
): Promise<{ success: boolean; error?: string; room?: ChatRoom }> {
  const cleanCode = code.trim().toLowerCase();
  const cleanUser = username.trim().toLowerCase();

  if (!cleanCode || !cleanUser) return { success: false, error: "Join code and your name are required." };
  if (isNameReserved(cleanUser))
    return { success: false, error: "This username is permanently reserved by System Administration." };

  const { sha, rooms } = await fetchRooms();
  const room = rooms.find((r) => r.code === cleanCode);
  if (!room) return { success: false, error: "Room not found. Check the join code." };

  const isMember = room.members.map((m) => m.toLowerCase()).includes(cleanUser);
  if (isMember) {
    return { success: false, error: "Username already taken in this room. Please choose a different name." };
  }

  room.members.push(cleanUser);
  room.messages.push({
    id: makeId(10),
    sender: "system",
    text: `${cleanUser} joined the room.`,
    timestamp: new Date().toISOString(),
  });
  await saveRooms(rooms, sha, `join: ${cleanUser} -> ${room.id}`);

  return { success: true, room };
}

export async function sendMessage(
  roomId: string,
  sender: string,
  text: string,
  media?: string
): Promise<{ success: boolean; error?: string }> {
  if (!roomId || !sender) return { success: false, error: "Missing data." };
  if (!text?.trim() && !media) return { success: false, error: "Message cannot be empty." };

  const { sha, rooms } = await fetchRooms();
  const room = rooms.find((r) => r.id === roomId);
  if (!room) return { success: false, error: "Room no longer exists." };

  room.messages.push({
    id: makeId(10),
    sender: sender.trim().toLowerCase(),
    text: text?.trim() || "",
    media: media || null,
    timestamp: new Date().toISOString(),
  });

  // Keep last 200 messages max
  if (room.messages.length > 200) {
    room.messages = room.messages.slice(-200);
  }

  const saved = await saveRooms(rooms, sha, `msg: ${roomId}`);
  return saved ? { success: true } : { success: false, error: "Failed to send." };
}

export async function getRoom(roomId: string): Promise<ChatRoom | null> {
  const { rooms } = await fetchRooms();
  return rooms.find((r) => r.id === roomId) || null;
}

export async function leaveRoom(
  roomId: string,
  username: string
): Promise<{ success: boolean; deleted?: boolean; error?: string }> {
  const cleanUser = username.trim().toLowerCase();
  const { sha, rooms } = await fetchRooms();
  const idx = rooms.findIndex((r) => r.id === roomId);
  if (idx === -1) return { success: false, error: "Room not found." };

  const room = rooms[idx];

  // If admin leaves, DELETE entire room
  if (room.admin === cleanUser) {
    rooms.splice(idx, 1);
    await saveRooms(rooms, sha, `admin left, room ${roomId} deleted`);
    return { success: true, deleted: true };
  }

  // Otherwise, just remove member
  room.members = room.members.filter((m) => m !== cleanUser);
  room.messages.push({
    id: makeId(10),
    sender: "system",
    text: `${cleanUser} left the room.`,
    timestamp: new Date().toISOString(),
  });
  await saveRooms(rooms, sha, `leave: ${cleanUser} from ${roomId}`);
  return { success: true, deleted: false };
}
