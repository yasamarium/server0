import { createFileRoute } from "@tanstack/react-router";

const DB_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Origin",
  "Access-Control-Max-Age": "86400",
  "Content-Type": "application/json; charset=utf-8",
};

function renderHtmlViewer(responseBody: any, origin: string) {
  const jsonString = JSON.stringify(responseBody, null, 2);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>shsDB — ${responseBody.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #060608;
      --card: rgba(18, 18, 24, 0.65);
      --border: rgba(255, 255, 255, 0.07);
      --purple: #a78bfa;
      --green: #a7f3d0;
      --text: #f3f4f6;
      --muted: #9ca3af;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Outfit', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px;
      overflow-x: hidden;
      position: relative;
    }

    /* Glow Orbs */
    .orb {
      position: absolute;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%);
      filter: blur(50px);
      z-index: -1;
      pointer-events: none;
    }
    .orb-1 { top: -100px; left: -100px; }
    .orb-2 { bottom: -100px; right: -100px; }

    header {
      width: 100%;
      max-width: 800px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 16px;
    }

    .logo {
      font-weight: 900;
      font-size: 20px;
      letter-spacing: -1px;
      text-decoration: none;
      color: var(--text);
    }
    .logo span {
      color: var(--purple);
    }

    .badge {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.2);
      color: var(--purple);
      padding: 4px 10px;
      border-radius: 12px;
      letter-spacing: 0.5px;
    }

    main {
      width: 100%;
      max-width: 800px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 24px;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.25);
    }

    .meta-grid {
      display: grid;
      grid-template-cols: repeat(auto-fit, minmax(130px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .meta-label {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      color: var(--muted);
      letter-spacing: 0.5px;
    }

    .meta-val {
      font-size: 15px;
      font-weight: 600;
      color: var(--text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    h1.title {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: var(--text);
    }

    .button-group {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 20px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 40px;
      padding: 0 16px;
      border-radius: 12px;
      font-size: 12.5px;
      font-weight: 800;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .btn-primary {
      background: var(--text);
      color: var(--bg);
    }
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255,255,255,0.1);
    }

    .btn-secondary {
      background: rgba(255,255,255,0.04);
      color: var(--text);
      border: 1px solid var(--border);
    }
    .btn-secondary:hover {
      background: rgba(255,255,255,0.08);
    }

    .code-container {
      position: relative;
      margin-top: 10px;
    }

    .copy-overlay {
      position: absolute;
      top: 14px;
      right: 14px;
      z-index: 10;
    }

    pre {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      line-height: 1.6;
      background: #09090d;
      padding: 20px;
      border-radius: 16px;
      overflow-x: auto;
      border: 1px solid rgba(255,255,255,0.04);
    }

    /* Syntax Highlighting */
    .key { color: var(--purple); }
    .string { color: var(--green); }
    .number { color: #fef08a; }
    .boolean { color: #f472b6; }
    .null { color: #64748b; }

    .toast {
      position: fixed;
      bottom: 24px;
      background: #10b981;
      color: white;
      font-size: 13px;
      font-weight: 800;
      padding: 10px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(16,185,129,0.3);
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }
  </style>
</head>
<body>
  <div class="orb orb-1"></div>
  <div class="orb orb-2"></div>

  <header>
    <a href="${origin}" class="logo">shs<span>DB</span></a>
    <div class="badge">shsDB API Node</div>
  </header>

  <main>
    <div class="card">
      <div class="meta-label">Database Record</div>
      <h1 class="title">${responseBody.title}</h1>
      
      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Node Key</span>
          <span class="meta-val">${responseBody.key}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Payload Type</span>
          <span class="meta-val" style="text-transform: uppercase;">${responseBody.type}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Backend Provider</span>
          <span class="meta-val">SHS Cloud</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Size</span>
          <span class="meta-val">${responseBody.size_bytes} Bytes</span>
        </div>
      </div>

      <div class="button-group">
        <button class="btn btn-primary" onclick="copyJson()">Copy Raw JSON</button>
        ${responseBody.url ? `<a href="${responseBody.url}" target="_blank" class="btn btn-secondary">Go to Associated URL ↗</a>` : ""}
        <a href="${origin}/shsdb-console" class="btn btn-secondary">Open shsDB Console</a>
      </div>
    </div>

    <div class="code-container">
      <div class="copy-overlay">
        <button class="btn btn-secondary" style="height:32px; border-radius:8px; font-size:11px;" onclick="copyJson()">Copy</button>
      </div>
      <pre><code id="json-code"></code></pre>
    </div>
  </main>

  <div id="toast" class="toast">Copied to clipboard!</div>

  <script>
    const rawData = ${jsonString};
    
    function syntaxHighlight(json) {
      if (typeof json !== 'string') {
        json = JSON.stringify(json, undefined, 2);
      }
      json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return json.replace(/("(\\\\u[a-zA-Z0-9]{4}|\\\\[^u]|[^\\\\"])*"(\\\\s*:)?|\\\\b(true|false|null)\\\\b|-?\\\\d+(?:\\\\.\\\\d*)?(?:[eE][+-]?\\\\d+)?)/g, function (match) {
        let cls = 'number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'key';
          } else {
            cls = 'string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'boolean';
        } else if (/null/.test(match)) {
          cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
      });
    }

    document.getElementById('json-code').innerHTML = syntaxHighlight(rawData);

    function copyJson() {
      navigator.clipboard.writeText(JSON.stringify(rawData, null, 2)).then(() => {
        const toast = document.getElementById('toast');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
      });
    }
  </script>
</body>
</html>`;
}

async function fetchDbValue(request: Request, id: string) {
  try {
    const targetUrl = `https://paste.rs/${id}`;
    
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      }
    });
    
    if (!res.ok) {
      return new Response(JSON.stringify({ success: false, error: `Database key not found: ${res.statusText}` }), {
        status: res.status === 404 ? 404 : 500,
        headers: DB_CORS,
      });
    }

    const rawContent = await res.text();
    
    let parsedContent: any;
    let payloadType = "text";
    let extractedTitle = "shsDB Node";
    let associatedUrl = "";

    try {
      // Check if it's our structured payload
      const obj = JSON.parse(rawContent);
      if (obj && (obj.data !== undefined || obj.title !== undefined)) {
        extractedTitle = obj.title || "shsDB Node";
        associatedUrl = obj.url || "";
        parsedContent = obj.data;
        payloadType = typeof obj.data === "object" ? "json" : "text";
      } else {
        parsedContent = obj;
        payloadType = "json";
      }
    } catch {
      parsedContent = rawContent;
      payloadType = "text";
    }

    const characterCount = rawContent.length;
    const wordCount = rawContent.split(/\s+/).filter(Boolean).length;
    const sizeBytes = new Blob([rawContent]).size;

    const responseBody = {
      success: true,
      key: id,
      title: extractedTitle,
      url: associatedUrl,
      type: payloadType,
      size_bytes: sizeBytes,
      character_count: characterCount,
      word_count: wordCount,
      data: parsedContent,
      raw: rawContent,
    };

    // Check if the user is visiting directly via browser
    const acceptHeader = request.headers.get("accept") || "";
    const origin = new URL(request.url).origin;

    if (acceptHeader.includes("text/html")) {
      return new Response(renderHtmlViewer(responseBody, origin), {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    return new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: DB_CORS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Failed to fetch shsDB value" }), {
      status: 500,
      headers: DB_CORS,
    });
  }
}

export const Route = createFileRoute("/shsdb/$id")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: DB_CORS }),
      GET: async ({ request, params }) => fetchDbValue(request, params.id),
    },
  },
});
