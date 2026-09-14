/* Orbit service worker — Web Push reminders (PRD F21). No offline caching:
   a video app must never serve a stale shell over a live room. */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Orbit", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Orbit";
  const options = {
    body: payload.body || "You have a meeting coming up.",
    icon: "/icons/icon-192.png",
    badge: "/icons/orbit-mark-mono.svg",
    tag: payload.tag || "orbit-reminder",
    renotify: Boolean(payload.tag),
    data: { url: payload.url || "/dashboard" },
    actions: payload.url ? [{ action: "open", title: "Open" }] : [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url =
    (event.notification.data && event.notification.data.url) || "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});
