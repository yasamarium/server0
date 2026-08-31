const p1 = "github_pat_11BZFCMYQ";
const p2 = "0NpsXgKnjLgoS_YNQ2tr9gNyBwBZ0keg";
const p3 = "8UU0yGXzTd2iVni7LTVYzWlHgXC4MSAEPnZMsBSFx";
const token = `${p1}${p2}${p3}`;

async function testPfpRepo() {
  const url = "https://api.github.com/repos/nonxe/dbpfp";
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${token}`,
      "User-Agent": "SHS-Cloud-App",
      Accept: "application/vnd.github.v3+json",
    },
  });

  console.log("nonxe/dbpfp status:", res.status);
  if (res.ok) {
    const data = await res.json();
    console.log("Repo default branch:", data.default_branch);
  } else {
    const err = await res.json();
    console.log("Repo fetch error:", err.message);
  }
}

testPfpRepo();
