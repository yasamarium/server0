export async function trackGlobalActivity(action: string, detail: string) {
  try {
    let userId: string | undefined = undefined;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cloud_user_account");
      if (stored) {
        const acc = JSON.parse(stored);
        if (acc?.id) userId = acc.id;
      }
    }
    await fetch("/api/accounts/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action, detail }),
    });
  } catch {}
}
