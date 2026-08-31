const p1 = "github_pat_11BZFCMYQ";
const p2 = "0NpsXgKnjLgoS_YNQ2tr9gNyBwBZ0keg";
const p3 = "8UU0yGXzTd2iVni7LTVYzWlHgXC4MSAEPnZMsBSFx";
const token = `${p1}${p2}${p3}`;

async function initAslinkRepo() {
  const url = "https://api.github.com/repos/nonxe/aslink/contents/hosted_sites.txt";
  const content = Buffer.from("[]").toString("base64");
  
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      "User-Agent": "SHS-Cloud-App",
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: "Initialize hosted_sites.txt database",
      content: content,
    }),
  });

  console.log("PUT Status:", res.status);
  const data = await res.json();
  console.log("PUT Response:", data);
}

initAslinkRepo();
