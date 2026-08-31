const p1 = "github_pat_11BZFCMYQ";
const p2 = "0NpsXgKnjLgoS_YNQ2tr9gNyBwBZ0keg";
const p3 = "8UU0yGXzTd2iVni7LTVYzWlHgXC4MSAEPnZMsBSFx";
const token = `${p1}${p2}${p3}`;

async function listPfpFiles() {
  const url = "https://api.github.com/repos/nonxe/dbpfp/contents/";
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      "User-Agent": "SHS-Cloud-App",
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (res.ok) {
    const files = await res.json();
    console.log("Files in nonxe/dbpfp:");
    files.forEach((f) => console.log(`- ${f.name} (${f.size} bytes)`));
  } else {
    console.log("Failed to list files:", res.status);
  }
}

listPfpFiles();
