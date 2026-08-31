/**
 * File Vault — Upload & Direct Download Resolver
 * 
 * Flow:
 * 1. Upload via POST https://api.onlyfiles.com/v1/upload → get file id + name
 * 2. Fetch https://onlyfiles.com/{id} → scrape the /dl/{token}/{id}/{filename} link from HTML
 * 3. That /dl/ URL serves the raw file directly (Content-Disposition: attachment)
 */

export interface FiUploadResult {
  success: boolean;
  id: string;
  filename: string;
  size: number;
  readableSize: string;
  directUrl: string | null;
  error?: string;
}

export interface FiFileInfo {
  success: boolean;
  id: string;
  filename: string;
  size: number;
  readableSize: string;
  directUrl: string | null;
  error?: string;
}

const UPSTREAM_API = "https://api.onlyfiles.com/v1";
const UPSTREAM_WEB = "https://onlyfiles.com";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Upload a file to upstream and immediately resolve the direct download link.
 */
export async function uploadFile(
  fileData: Blob | Buffer | ArrayBuffer,
  filename: string,
  expireSeconds: number = 0,
): Promise<FiUploadResult> {
  try {
    const fd = new FormData();
    const blob = fileData instanceof Blob ? fileData : new Blob([fileData]);
    fd.append("file", blob, filename);
    fd.append("expire", String(expireSeconds));

    const res = await fetch(`${UPSTREAM_API}/upload`, {
      method: "POST",
      body: fd,
      headers: { "User-Agent": UA },
    });

    const json = await res.json();
    if (!res.ok || !json.status || !json.data?.file) {
      throw new Error(json.error?.message || `Upload failed (${res.status})`);
    }

    const meta = json.data.file;
    const id = meta.metadata?.id || meta.url?.short?.split("/").pop() || "";
    const name = meta.metadata?.name || filename;
    const bytes = meta.metadata?.size?.bytes || 0;
    const readable = meta.metadata?.size?.readable || "";

    // Immediately resolve the direct download link
    let directUrl: string | null = null;
    if (id) {
      directUrl = await scrapeDirectUrl(id);
    }

    return { success: true, id, filename: name, size: bytes, readableSize: readable, directUrl };
  } catch (err: any) {
    return {
      success: false, id: "", filename, size: 0, readableSize: "",
      directUrl: null, error: err.message || "Upload failed",
    };
  }
}

/**
 * Get file info from the official API (fast, always works).
 */
export async function getFileInfo(fileId: string): Promise<FiFileInfo | null> {
  try {
    const id = fileId.split("/")[0].trim();
    if (!id) return null;

    const res = await fetch(`${UPSTREAM_API}/file/${id}/info`, {
      headers: { "User-Agent": UA },
    });
    if (!res.ok) return null;

    const json = await res.json();
    if (!json.status || !json.data?.file) return null;

    const meta = json.data.file;
    const name = meta.metadata?.name || "file";
    const bytes = meta.metadata?.size?.bytes || 0;
    const readable = meta.metadata?.size?.readable || "";

    // Now scrape the direct download link
    const directUrl = await scrapeDirectUrl(id);

    return { success: true, id, filename: name, size: bytes, readableSize: readable, directUrl };
  } catch {
    return null;
  }
}

/**
 * Scrape the direct /dl/ download link from the file landing page HTML.
 * The HTML contains: <a class="download" href="https://onlyfiles.com/dl/{token}/{id}/{filename}">
 * That URL serves the raw file directly with Content-Disposition: attachment.
 */
export async function scrapeDirectUrl(fileId: string): Promise<string | null> {
  try {
    const id = fileId.split("/")[0].trim();
    if (!id) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${UPSTREAM_WEB}/${id}`, {
      signal: controller.signal,
      headers: { "User-Agent": UA },
    });

    clearTimeout(timeout);
    if (!res.ok) return null;

    const html = await res.text();

    // Extract the /dl/ link: href="https://onlyfiles.com/dl/{token}/{id}/{filename}"
    const dlMatch = html.match(/href="(https?:\/\/onlyfiles\.com\/dl\/[^"]+)"/);
    if (dlMatch && dlMatch[1]) {
      return dlMatch[1];
    }

    return null;
  } catch {
    return null;
  }
}
