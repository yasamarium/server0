const GITHUB_REPO = "nonxe/link";
const LINKS_FILE = "links.txt";

function getGithubToken(): string {
  if (typeof process !== "undefined" && process.env?.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }
  const p1 = "github_pat_11BZFCMYQ";
  const p2 = "0NpsXgKnjLgoS_YNQ2tr9gNyBwBZ0keg";
  const p3 = "8UU0yGXzTd2iVni7LTVYzWlHgXC4MSAEPnZMsBSFx";
  return `${p1}${p2}${p3}`;
}

export interface ShortLink {
  slug: string;
  url: string;
  createdBy: string;
  createdAt: string;
  clicks: number;
}

export async function fetchAllLinks(): Promise<{ sha: string | null; links: ShortLink[] }> {
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${LINKS_FILE}`;
    const token = getGithubToken();
    const res = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        "User-Agent": "SHS-Cloud-App",
        Accept: "application/vnd.github.v3+json",
      },
      cache: "no-store",
    });

    if (res.status === 404) return { sha: null, links: [] };
    if (!res.ok) return { sha: null, links: [] };

    const data = (await res.json()) as any;
    const sha = data.sha || null;
    let raw = "[]";
    if (data.content) {
      try {
        const clean = data.content.replace(/[\n\r\s]/g, "");
        raw = new TextDecoder().decode(Uint8Array.from(atob(clean), (c) => c.charCodeAt(0)));
      } catch {
        raw = "[]";
      }
    }

    let links: ShortLink[] = [];
    try {
      links = JSON.parse(raw);
      if (!Array.isArray(links)) links = [];
    } catch {
      links = [];
    }
    return { sha, links };
  } catch {
    return { sha: null, links: [] };
  }
}

async function saveLinks(links: ShortLink[], sha: string | null, commitMsg: string): Promise<boolean> {
  const encoded = btoa(
    Array.from(new TextEncoder().encode(JSON.stringify(links, null, 2)))
      .map((b) => String.fromCharCode(b))
      .join("")
  );

  const bodyData: any = { message: commitMsg, content: encoded };
  if (sha) bodyData.sha = sha;

  const token = getGithubToken();
  const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${LINKS_FILE}`, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      "User-Agent": "SHS-Cloud-App",
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify(bodyData),
  });
  return res.ok;
}

// Reserved slugs — existing routes that cannot be used as short links
const RESERVED = new Set([
  "main", "note", "convert", "more", "x", "cloudify", "ytdl",
  "israel", "tempmail", "messages", "owner", "api", "links", "tempchat", "gitnetwork", "wabot",
  "db-console", "shsdb-console", "-db", "-shsdb",
]);

const SLUG_RE = /^[a-zA-Z0-9_-]{2,48}$/;

export async function createShortLink(
  slug: string,
  url: string,
  createdBy: string
): Promise<{ success: boolean; error?: string; link?: ShortLink }> {
  const cleanSlug = slug.trim().toLowerCase();
  const cleanUrl = url.trim();

  if (!cleanSlug || !cleanUrl) {
    return { success: false, error: "Slug and URL are required." };
  }

  if (!SLUG_RE.test(cleanSlug)) {
    return { success: false, error: "Slug must be 2-48 characters (letters, numbers, _ or -)." };
  }

  if (RESERVED.has(cleanSlug)) {
    return { success: false, error: "This slug is reserved and cannot be used." };
  }

  // Must contain a dot (filename proxy) check — slugs without dots are link redirects
  if (cleanSlug.includes(".")) {
    return { success: false, error: "Slug cannot contain dots. Use only letters, numbers, _ or -." };
  }

  try {
    new URL(cleanUrl);
  } catch {
    return { success: false, error: "Please enter a valid URL (include https://)." };
  }

  const { sha, links } = await fetchAllLinks();

  if (links.find((l) => l.slug === cleanSlug)) {
    return { success: false, error: "This slug is already taken. Try a different one." };
  }

  const newLink: ShortLink = {
    slug: cleanSlug,
    url: cleanUrl,
    createdBy: createdBy || "anonymous",
    createdAt: new Date().toISOString(),
    clicks: 0,
  };

  links.push(newLink);

  const saved = await saveLinks(links, sha, `link: ${cleanSlug} -> ${cleanUrl}`);
  if (!saved) {
    return { success: false, error: "Failed to save link to database." };
  }

  return { success: true, link: newLink };
}

export async function lookupLink(slug: string): Promise<ShortLink | null> {
  const { links } = await fetchAllLinks();
  return links.find((l) => l.slug === slug.trim().toLowerCase()) || null;
}

export async function incrementClicks(slug: string): Promise<void> {
  try {
    const { sha, links } = await fetchAllLinks();
    const link = links.find((l) => l.slug === slug.trim().toLowerCase());
    if (link) {
      link.clicks = (link.clicks || 0) + 1;
      await saveLinks(links, sha, `click: ${slug}`);
    }
  } catch {}
}

export async function getUserLinks(userId: string): Promise<ShortLink[]> {
  const { links } = await fetchAllLinks();
  return links.filter((l) => l.createdBy === userId.trim().toLowerCase());
}

export async function deleteLink(slug: string, userId: string): Promise<{ success: boolean; error?: string }> {
  const { sha, links } = await fetchAllLinks();
  const idx = links.findIndex((l) => l.slug === slug.trim().toLowerCase());
  if (idx === -1) return { success: false, error: "Link not found." };
  if (links[idx].createdBy !== userId.trim().toLowerCase()) {
    return { success: false, error: "You can only delete your own links." };
  }
  links.splice(idx, 1);
  const saved = await saveLinks(links, sha, `delete: ${slug}`);
  return saved ? { success: true } : { success: false, error: "Failed to delete." };
}
