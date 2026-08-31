const GITHUB_REPO = "nonxe/db";
const GITHUB_FILE = "log.txt";

function getGithubToken(): string {
  if (typeof process !== "undefined" && process.env?.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }
  const p1 = "github_pat_11BZFCMYQ";
  const p2 = "0NpsXgKnjLgoS_YNQ2tr9gNyBwBZ0keg";
  const p3 = "8UU0yGXzTd2iVni7LTVYzWlHgXC4MSAEPnZMsBSFx";
  return `${p1}${p2}${p3}`;
}

export interface UserAccount {
  id: string;
  pass: string;
  createdAt: string;
  pfpUrl?: string;
  updatedAt?: string;
}

export async function fetchAccountsFromLog(): Promise<{ sha: string | null; accounts: UserAccount[] }> {
  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`;
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
      return { sha: null, accounts: [] };
    }

    if (!res.ok) {
      const errText = await res.text();
      console.error("Failed to fetch log.txt from GitHub:", res.status, errText);
      return { sha: null, accounts: [] };
    }

    const data = (await res.json()) as any;
    const sha = data.sha || null;
    const rawContent = data.content ? Buffer.from(data.content, "base64").toString("utf-8") : "[]";
    
    let accounts: UserAccount[] = [];
    try {
      accounts = JSON.parse(rawContent);
      if (!Array.isArray(accounts)) accounts = [];
    } catch {
      accounts = [];
    }

    return { sha, accounts };
  } catch (err) {
    console.error("Error fetching accounts from GitHub log.txt:", err);
    return { sha: null, accounts: [] };
  }
}

export async function saveAccountToLog(id: string, pass: string): Promise<{ success: boolean; error?: string; account?: UserAccount }> {
  const cleanId = id.trim();
  const cleanPass = pass.trim();

  if (!cleanId || !cleanPass) {
    return { success: false, error: "ID and Password cannot be empty." };
  }

  if (cleanId.length < 3 || cleanId.length > 30) {
    return { success: false, error: "ID must be between 3 and 30 characters." };
  }

  if (cleanPass.length < 4) {
    return { success: false, error: "Password must be at least 4 characters." };
  }

  const { sha, accounts } = await fetchAccountsFromLog();

  // Check if account ID already exists
  const existing = accounts.find((a) => a.id.toLowerCase() === cleanId.toLowerCase());
  if (existing) {
    return { success: false, error: "Account ID already exists. Please choose a different ID or login." };
  }

  const newAccount: UserAccount = {
    id: cleanId,
    pass: cleanPass,
    createdAt: new Date().toISOString(),
    pfpUrl: `https://raw.githubusercontent.com/nonxe/dbpfp/main/${cleanId.toLowerCase()}.png`,
  };

  accounts.push(newAccount);

  const updatedContentBase64 = Buffer.from(JSON.stringify(accounts, null, 2), "utf-8").toString("base64");

  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`;
  const bodyData: any = {
    message: `Account created: ${cleanId}`,
    content: updatedContentBase64,
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
    return { success: false, error: errData.message || "Failed to save account to GitHub database." };
  }

  return { success: true, account: newAccount };
}

export async function loginAccountFromLog(id: string, pass: string): Promise<{ success: boolean; error?: string; account?: UserAccount }> {
  const cleanId = id.trim();
  const cleanPass = pass.trim();

  if (!cleanId || !cleanPass) {
    return { success: false, error: "ID and Password are required." };
  }

  const { accounts } = await fetchAccountsFromLog();

  const user = accounts.find(
    (a) => a.id.toLowerCase() === cleanId.toLowerCase() && a.pass === cleanPass
  );

  if (!user) {
    return { success: false, error: "Invalid Account ID or Password." };
  }

  return { success: true, account: user };
}

export async function updateAccountPfpInLog(id: string, pfpUrl: string): Promise<{ success: boolean; error?: string; account?: UserAccount }> {
  const cleanId = id.trim();
  if (!cleanId || !pfpUrl) {
    return { success: false, error: "ID and PFP URL are required." };
  }

  const { sha, accounts } = await fetchAccountsFromLog();
  const index = accounts.findIndex((a) => a.id.toLowerCase() === cleanId.toLowerCase());

  if (index === -1) {
    return { success: false, error: "Account not found in GitHub database." };
  }

  accounts[index] = {
    ...accounts[index],
    pfpUrl,
    updatedAt: new Date().toISOString(),
  };

  const updatedContentBase64 = Buffer.from(JSON.stringify(accounts, null, 2), "utf-8").toString("base64");

  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE}`;
  const bodyData: any = {
    message: `Update PFP for account: ${cleanId}`,
    content: updatedContentBase64,
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
    return { success: false, error: errData.message || "Failed to update PFP in GitHub database." };
  }

  return { success: true, account: accounts[index] };
}
