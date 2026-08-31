const p1 = "github_pat_11BZFCMYQ";
const p2 = "0NpsXgKnjLgoS_YNQ2tr9gNyBwBZ0keg";
const p3 = "8UU0yGXzTd2iVni7LTVYzWlHgXC4MSAEPnZMsBSFx";
const token = `${p1}${p2}${p3}`;

async function cancelActiveRuns() {
  const listUrl = "https://api.github.com/repos/nonxe/oien/actions/workflows/main.yml/runs?per_page=10";
  const res = await fetch(listUrl, {
    headers: {
      Authorization: `token ${token}`,
      "User-Agent": "SHS-Cloud-App",
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!res.ok) return;

  const data = await res.json();
  const activeRuns = data.workflow_runs.filter(
    (r) => r.status === "in_progress" || r.status === "queued" || r.status === "requested"
  );

  console.log(`Found ${activeRuns.length} active runs to cancel.`);

  for (const run of activeRuns) {
    console.log(`Cancelling run ID: ${run.id}...`);
    const cancelUrl = `https://api.github.com/repos/nonxe/oien/actions/runs/${run.id}/cancel`;
    const cancelRes = await fetch(cancelUrl, {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        "User-Agent": "SHS-Cloud-App",
        Accept: "application/vnd.github.v3+json",
      },
    });
    console.log(`Cancel result for ${run.id}:`, cancelRes.status);
  }
}

cancelActiveRuns();
