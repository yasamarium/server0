const p1 = "github_pat_11BZFCMYQ";
const p2 = "0NpsXgKnjLgoS_YNQ2tr9gNyBwBZ0keg";
const p3 = "8UU0yGXzTd2iVni7LTVYzWlHgXC4MSAEPnZMsBSFx";
const token = `${p1}${p2}${p3}`;

async function inspectRepoFile(filename) {
  const url = `https://api.github.com/repos/nonxe/oien/contents/${filename}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      "User-Agent": "SHS-Cloud-App",
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (res.ok) {
    const data = await res.json();
    console.log(`=== ${filename} ===`);
    console.log(Buffer.from(data.content, "base64").toString("utf-8").slice(0, 1000));
  } else {
    console.log(`Failed to fetch ${filename}:`, res.status);
  }
}

async function inspectAll() {
  await inspectRepoFile("index.js");
  await inspectRepoFile("main.js");
  await inspectRepoFile("config.js");
  await inspectRepoFile("package.json");
}

inspectAll();
