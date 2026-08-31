const p1 = "github_pat_11BZFCMYQ";
const p2 = "0NpsXgKnjLgoS_YNQ2tr9gNyBwBZ0keg";
const p3 = "8UU0yGXzTd2iVni7LTVYzWlHgXC4MSAEPnZMsBSFx";
const token = `${p1}${p2}${p3}`;

const GITHUB_REPO = "nonxe/oien";
const WORKFLOW_ID = "main.yml";

async function testEnableDisable() {
  console.log("Testing workflow disable API...");
  const disableUrl = `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_ID}/disable`;
  const disableRes = await fetch(disableUrl, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      "User-Agent": "SHS-Cloud-App",
      Accept: "application/vnd.github.v3+json",
    },
  });
  console.log("Disable status:", disableRes.status);

  console.log("Testing workflow enable API...");
  const enableUrl = `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_ID}/enable`;
  const enableRes = await fetch(enableUrl, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      "User-Agent": "SHS-Cloud-App",
      Accept: "application/vnd.github.v3+json",
    },
  });
  console.log("Enable status:", enableRes.status);
}

testEnableDisable();
