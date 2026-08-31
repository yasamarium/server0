const p1 = "github_pat_11BZFCMYQ";
const p2 = "0NpsXgKnjLgoS_YNQ2tr9gNyBwBZ0keg";
const p3 = "8UU0yGXzTd2iVni7LTVYzWlHgXC4MSAEPnZMsBSFx";
const token = `${p1}${p2}${p3}`;

// 1x1 transparent PNG base64
const samplePngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

async function testUploadPfp() {
  const username = "testuser";
  const filename = `${username}.png`;
  const url = `https://api.github.com/repos/nonxe/dbpfp/contents/${filename}`;

  // Check if file already exists to get SHA
  let sha = null;
  const getRes = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      "User-Agent": "SHS-Cloud-App",
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
  }

  const body = {
    message: `Update PFP for ${username}`,
    content: samplePngBase64,
  };
  if (sha) body.sha = sha;

  const putRes = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      "User-Agent": "SHS-Cloud-App",
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  console.log("PUT PFP Status:", putRes.status);
  const rawUrl = `https://raw.githubusercontent.com/nonxe/dbpfp/main/${filename}`;
  console.log("Raw PFP Link:", rawUrl);
}

testUploadPfp();
