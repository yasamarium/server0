const p1 = "github_pat_11BZFCMYQ";
const p2 = "0NpsXgKnjLgoS_YNQ2tr9gNyBwBZ0keg";
const p3 = "8UU0yGXzTd2iVni7LTVYzWlHgXC4MSAEPnZMsBSFx";
const token = `${p1}${p2}${p3}`;

async function checkBotDb() {
  const url = "https://api.github.com/repos/nonxe/oien/contents/bot.db";
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      "User-Agent": "SHS-Cloud-App",
      Accept: "application/vnd.github.v3+json",
    },
  });

  console.log("bot.db Status:", res.status);
  if (res.ok) {
    const data = await res.json();
    console.log("bot.db sha:", data.sha, "size:", data.size);
  }
}

checkBotDb();
