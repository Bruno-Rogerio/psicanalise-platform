function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem("_asid");
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("_asid", sid);
  }
  return sid;
}

export function trackPageview(path?: string) {
  if (typeof window === "undefined") return;
  const page_path = path || window.location.pathname;
  const session_id = getSessionId();
  const referrer = document.referrer || null;

  // Google Analytics
  window.gtag?.("event", "page_view", { page_path });

  // Nosso contador
  fetch("/api/analytics/pageview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page_path, referrer, session_id }),
  }).catch(() => {});
}

export function trackEvent(
  event_name: string,
  event_category: string,
  event_label: string,
  event_value?: string
) {
  if (typeof window === "undefined") return;
  const session_id = getSessionId();
  const page_path = window.location.pathname;

  // Google Analytics
  window.gtag?.("event", event_name, {
    event_category,
    event_label,
    value: event_value,
  });

  // Nosso contador
  fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event_name, event_category, event_label, event_value, page_path, session_id }),
  }).catch(() => {});
}
