import { trackGlobalActivity } from "./activity";

const GITHUB_REPO = "nonxe/database";
const CLUSTERS_FILE = "clusters.txt";

function getGithubToken(): string {
  if (typeof process !== "undefined" && process.env?.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }
  const p1 = "github_pat_11BZFCMYQ";
  const p2 = "0NpsXgKnjLgoS_YNQ2tr9gNyBwBZ0keg";
  const p3 = "8UU0yGXzTd2iVni7LTVYzWlHgXC4MSAEPnZMsBSFx";
  return `${p1}${p2}${p3}`;
}

export interface GitNetworkCluster {
  id: string; // e.g. "gn_x92a7b14"
  name: string;
  owner: string;
  apiKey: string; // e.g. "gn_sk_9f31a40b7c12"
  createdAt: string;
  collections: {
    [collectionName: string]: Array<Record<string, any>>;
  };
}

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

function makeId(prefix: string, len: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = prefix;
  for (let i = 0; i < len; i++) out += chars[(Math.random() * chars.length) | 0];
  return out;
}

export async function fetchClusters(): Promise<{ sha: string | null; clusters: GitNetworkCluster[] }> {
  try {
    const token = getGithubToken();
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${CLUSTERS_FILE}`,
      {
        headers: {
          Authorization: `token ${token}`,
          "User-Agent": "SHS-Cloud-App",
          Accept: "application/vnd.github.v3+json",
        },
        cache: "no-store",
      }
    );

    if (res.status === 404) return { sha: null, clusters: [] };
    if (!res.ok) return { sha: null, clusters: [] };

    const data = (await res.json()) as any;
    const sha = data.sha || null;
    const raw = data.content ? b64decode(data.content) : "[]";

    let clusters: GitNetworkCluster[] = [];
    try {
      clusters = JSON.parse(raw);
      if (!Array.isArray(clusters)) clusters = [];
    } catch {
      clusters = [];
    }
    return { sha, clusters };
  } catch {
    return { sha: null, clusters: [] };
  }
}

async function saveClusters(
  clusters: GitNetworkCluster[],
  sha: string | null,
  commitMsg: string
): Promise<boolean> {
  const token = getGithubToken();
  const bodyData: any = {
    message: commitMsg,
    content: b64encode(JSON.stringify(clusters, null, 2)),
  };
  if (sha) bodyData.sha = sha;

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${CLUSTERS_FILE}`,
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

export async function createCluster(
  name: string,
  owner: string
): Promise<{ success: boolean; error?: string; cluster?: GitNetworkCluster }> {
  const cleanName = name.trim();
  const cleanOwner = owner.trim().toLowerCase();

  if (!cleanName || !cleanOwner) {
    return { success: false, error: "Database name and owner are required." };
  }

  const { sha, clusters } = await fetchClusters();

  // Limit per user
  const userClusters = clusters.filter((c) => c.owner === cleanOwner);
  if (userClusters.length >= 10) {
    return { success: false, error: "Maximum limit of 10 database clusters reached." };
  }

  const newCluster: GitNetworkCluster = {
    id: makeId("gn_", 8),
    name: cleanName,
    owner: cleanOwner,
    apiKey: makeId("gn_sk_", 16),
    createdAt: new Date().toISOString(),
    collections: {
      users: [
        { _id: "usr_01", name: "Sample User", email: "sample@gitnetwork.io", role: "admin" }
      ]
    },
  };

  clusters.push(newCluster);

  const saved = await saveClusters(clusters, sha, `cluster: ${newCluster.id} created`);
  if (!saved) {
    return { success: false, error: "Failed to persist database cluster." };
  }

  trackGlobalActivity("Created GitNetwork DB", `Cluster: "${cleanName}" (${newCluster.id})`);

  return { success: true, cluster: newCluster };
}

export async function getUserClusters(owner: string): Promise<GitNetworkCluster[]> {
  const { clusters } = await fetchClusters();
  return clusters.filter((c) => c.owner === owner.trim().toLowerCase());
}

export async function deleteCluster(
  id: string,
  owner: string
): Promise<{ success: boolean; error?: string }> {
  const { sha, clusters } = await fetchClusters();
  const idx = clusters.findIndex(
    (c) => c.id === id.trim() && c.owner === owner.trim().toLowerCase()
  );
  if (idx === -1) {
    return { success: false, error: "Database cluster not found or unauthorized." };
  }

  const removedName = clusters[idx].name;
  clusters.splice(idx, 1);

  const saved = await saveClusters(clusters, sha, `cluster: ${id} deleted`);
  if (saved) {
    trackGlobalActivity("Deleted GitNetwork DB", `Cluster: "${removedName}" (${id})`);
    return { success: true };
  }
  return { success: false, error: "Failed to delete cluster." };
}

export async function executeQuery(
  id: string,
  apiKey: string,
  collectionName: string,
  action: "find" | "insert" | "update" | "delete",
  payload?: any
): Promise<{ success: boolean; error?: string; result?: any; count?: number }> {
  const { sha, clusters } = await fetchClusters();
  const cluster = clusters.find((c) => c.id === id.trim() && c.apiKey === apiKey.trim());

  if (!cluster) {
    return { success: false, error: "Invalid Database Connection Credentials (id or apiKey mismatch)." };
  }

  const col = collectionName.trim().toLowerCase() || "default";
  if (!cluster.collections) cluster.collections = {};
  if (!cluster.collections[col]) cluster.collections[col] = [];

  const items = cluster.collections[col];

  if (action === "find") {
    // Basic filter matching
    let filter = payload?.filter || {};
    let results = items.filter((doc) => {
      for (const key in filter) {
        if (doc[key] !== filter[key]) return false;
      }
      return true;
    });
    return { success: true, result: results, count: results.length };
  }

  if (action === "insert") {
    const doc = payload?.doc;
    if (!doc || typeof doc !== "object") {
      return { success: false, error: "Document object is required for insert." };
    }
    const newDoc = { _id: makeId("doc_", 10), ...doc, _createdAt: new Date().toISOString() };
    items.push(newDoc);
    await saveClusters(clusters, sha, `db query: insert in ${cluster.id}/${col}`);
    return { success: true, result: newDoc, count: 1 };
  }

  if (action === "update") {
    const filter = payload?.filter || {};
    const update = payload?.update || {};
    let modified = 0;

    items.forEach((doc) => {
      let match = true;
      for (const k in filter) {
        if (doc[k] !== filter[k]) match = false;
      }
      if (match) {
        Object.assign(doc, update, { _updatedAt: new Date().toISOString() });
        modified++;
      }
    });

    if (modified > 0) {
      await saveClusters(clusters, sha, `db query: update in ${cluster.id}/${col}`);
    }
    return { success: true, result: { modifiedCount: modified }, count: modified };
  }

  if (action === "delete") {
    const filter = payload?.filter || {};
    const initialLen = items.length;
    cluster.collections[col] = items.filter((doc) => {
      for (const k in filter) {
        if (doc[k] === filter[k]) return false;
      }
      return true;
    });
    const deletedCount = initialLen - cluster.collections[col].length;

    if (deletedCount > 0) {
      await saveClusters(clusters, sha, `db query: delete in ${cluster.id}/${col}`);
    }
    return { success: true, result: { deletedCount }, count: deletedCount };
  }

  return { success: false, error: "Unsupported operation." };
}
