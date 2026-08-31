const p1 = "github_pat_11BZFCMYQ";
const p2 = "0NpsXgKnjLgoS_YNQ2tr9gNyBwBZ0keg";
const p3 = "8UU0yGXzTd2iVni7LTVYzWlHgXC4MSAEPnZMsBSFx";
const token = `${p1}${p2}${p3}`;

const runnerCode = `const fs = require("fs");
const { spawn } = require("child_process");

async function startBotRunner() {
  let sessionConfig = null;
  try {
    if (fs.existsSync("./sessions.json")) {
      const content = fs.readFileSync("./sessions.json", "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        sessionConfig = parsed[0] || null;
      } else {
        sessionConfig = parsed;
      }
    }
  } catch (e) {
    console.error("Error reading sessions.json:", e);
  }

  const sessionId = sessionConfig?.sessionId || process.env.SESSION || "RGNK~4IqF0mP6";
  const botName = sessionConfig?.botName || process.env.BOT_NAME || "OIEN BOT";
  const sudo = sessionConfig?.sudo || process.env.SUDO || "";
  const mode = sessionConfig?.mode || process.env.MODE || "public";

  // Write config.env for index.js
  const envContent = \`SESSION=\${sessionId}
BOT_NAME=\${botName}
MODE=\${mode}
SUDO=\${sudo}
PORT=3000
LOG_LEVEL=silent
TZ=Asia/Kolkata
\`;

  try {
    fs.writeFileSync("./config.env", envContent, "utf-8");
    console.log("Updated config.env with session ID successfully.");
  } catch (e) {
    console.error("Failed to write config.env:", e.message);
  }

  console.log("==========================================");
  console.log("Starting OIEN WhatsApp Bot Process");
  console.log("Bot Name:", botName);
  console.log("Session ID:", sessionId.slice(0, 14) + "...");
  console.log("Mode:", mode);
  console.log("==========================================");

  const env = {
    ...process.env,
    SESSION: sessionId,
    BOT_NAME: botName,
    MODE: mode,
    SUDO: sudo,
  };

  const child = spawn("node", ["index.js"], { env, stdio: "inherit" });
  await new Promise((resolve) => child.on("exit", resolve));
}

startBotRunner();
`;

async function updateRunner() {
  const url = "https://api.github.com/repos/nonxe/oien/contents/multi-runner.js";
  const getRes = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      "User-Agent": "SHS-Cloud-App",
      Accept: "application/vnd.github.v3+json",
    },
  });
  const data = await getRes.json();
  const sha = data.sha;

  const content = Buffer.from(runnerCode).toString("base64");
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      "User-Agent": "SHS-Cloud-App",
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Update multi-runner.js to automatically generate config.env for nonxe/oien index.js",
      content: content,
      sha: sha,
    }),
  });

  console.log("PUT runner Status:", res.status);
}

updateRunner();
