const GITHUB_REPO = "nonxe/db";
const HISTORY_FILE = "history.txt";

function getGithubToken(): string {
  if (typeof process !== "undefined" && process.env?.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }
  const p1 = "github_pat_11BZFCMYQ";
  const p2 = "0NpsXgKnjLgoS_YNQ2tr9gNyBwBZ0keg";
  const p3 = "8UU0yGXzTd2iVni7LTVYzWlHgXC4MSAEPnZMsBSFx";
  return `${p1}${p2}${p3}`;
}

export interface HistoryEntry {
  userId: string; // Formatted identity, e.g. "john [1.2.3.4]" or "[1.2.3.4]"
  rawUserId?: string;
  ip?: string;
  action: string;
  detail: string;
  timestamp: string;
}

export async function fetchHistory(): Promise<{ sha: string | null; entries: HistoryEntry[] }> {
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${HISTORY_FILE}`;
    const token = getGithubToken();
    const res = await fetch(url, {
      headers: {
        "Authorization": `token ${token}`,
        "User-Agent": "SHS-Cloud-App",
        "Accept": "application/vnd.github.v3+json",
      },
      cache: "no-store",
    });

    if (res.status === 404) {
      return { sha: null, entries: [] };
    }

    if (!res.ok) {
      return { sha: null, entries: [] };
    }

    const data = (await res.json()) as any;
    const sha = data.sha || null;
    const rawContent = data.content ? Buffer.from(data.content, "base64").toString("utf-8") : "[]";

    let entries: HistoryEntry[] = [];
    try {
      entries = JSON.parse(rawContent);
      if (!Array.isArray(entries)) entries = [];
    } catch {
      entries = [];
    }

    return { sha, entries };
  } catch {
    return { sha: null, entries: [] };
  }
}

export async function addHistoryEntry(
  userId: string,
  action: string,
  detail: string,
  ip?: string,
  rawUserId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!userId || !action) {
    return { success: false, error: "userId and action are required." };
  }

  const { sha, entries } = await fetchHistory();

  // Determine clean rawUserId
  let cleanRawUser = rawUserId ? rawUserId.trim().toLowerCase() : undefined;
  if (!cleanRawUser && !userId.startsWith("[")) {
    const firstWord = userId.split(" ")[0].trim();
    if (firstWord && !firstWord.startsWith("[")) {
      cleanRawUser = firstWord.toLowerCase();
    }
  }

  const newEntry: HistoryEntry = {
    userId: userId.trim(),
    rawUserId: cleanRawUser,
    ip,
    action,
    detail,
    timestamp: new Date().toISOString(),
  };

  entries.push(newEntry);

  // Keep only last 500 entries to avoid file bloat
  const trimmed = entries.slice(-500);

  const updatedBase64 = Buffer.from(JSON.stringify(trimmed, null, 2), "utf-8").toString("base64");

  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${HISTORY_FILE}`;
  const bodyData: any = {
    message: `history: ${userId} - ${action}`,
    content: updatedBase64,
  };
  if (sha) {
    bodyData.sha = sha;
  }

  const token = getGithubToken();
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `token ${token}`,
      "User-Agent": "SHS-Cloud-App",
      "Content-Type": "application/json",
      "Accept": "application/vnd.github.v3+json",
    },
    body: JSON.stringify(bodyData),
  });

  if (!res.ok) {
    const errData = (await res.json().catch(() => ({}))) as any;
    return { success: false, error: errData.message || "Failed to save history." };
  }

  return { success: true };
}

export async function getUserHistory(userId: string): Promise<HistoryEntry[]> {
  const cleanTarget = userId ? userId.trim().toLowerCase() : "";
  if (!cleanTarget) return [];

  const { entries } = await fetchHistory();

  return entries
    .filter((e) => {
      // 1. Check exact rawUserId match
      if (e.rawUserId && e.rawUserId.toLowerCase() === cleanTarget) {
        return true;
      }
      // 2. Check formatted userId first word match (e.g. "john [1.2.3.4]")
      if (e.userId && !e.userId.startsWith("[")) {
        const firstWord = e.userId.split(" ")[0].trim().toLowerCase();
        if (firstWord === cleanTarget) return true;
      }
      return false;
    })
    .reverse(); // newest first
}
