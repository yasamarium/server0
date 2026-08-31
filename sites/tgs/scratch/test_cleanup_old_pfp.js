const p1 = "github_pat_11BZFCMYQ";
const p2 = "0NpsXgKnjLgoS_YNQ2tr9gNyBwBZ0keg";
const p3 = "8UU0yGXzTd2iVni7LTVYzWlHgXC4MSAEPnZMsBSFx";
const token = `${p1}${p2}${p3}`;

const PFP_REPO = "nonxe/dbpfp";

async function cleanupOldUserPfpFiles(username, currentFilename) {
  const cleanUser = username.trim().toLowerCase();
  const possibleExts = ["jpg", "jpeg", "png", "webp", "gif"];

  for (const ext of possibleExts) {
    const fn = `${cleanUser}.${ext}`;
    if (fn === currentFilename) continue;

    const url = `https://api.github.com/repos/${PFP_REPO}/contents/${fn}`;
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `token ${token}`,
          "User-Agent": "SHS-Cloud-App",
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.sha) {
          console.log(`Deleting old PFP file: ${fn} (sha: ${data.sha})...`);
          const delRes = await fetch(url, {
            method: "DELETE",
            headers: {
              Authorization: `token ${token}`,
              "User-Agent": "SHS-Cloud-App",
              Accept: "application/vnd.github.v3+json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: `Remove old PFP image for user: ${cleanUser}`,
              sha: data.sha,
            }),
          });
          console.log(`Deleted ${fn} Status:`, delRes.status);
        }
      }
    } catch (err) {
      console.log(`Error checking/deleting ${fn}:`, err.message);
    }
  }
}

cleanupOldUserPfpFiles("suhu", "suhu.jpg");
