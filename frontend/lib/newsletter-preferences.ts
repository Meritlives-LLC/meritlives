const KEY = "meritlives-newsletter";
export const NEWSLETTER_SUCCESS = "meritlives:newsletter-success";
let subscribed = false;
let shown = false;
let dismissedUntil = 0;

export function popupSuppressed() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    return subscribed || shown || saved?.subscribed === true || Date.now() < Math.max(dismissedUntil, Number(saved?.dismissedUntil) || 0);
  } catch { return subscribed || shown || Date.now() < dismissedUntil; }
}
export function markPopupShown() { shown = true; }
export function dismissNewsletter() {
  dismissedUntil = Date.now() + 30 * 24 * 60 * 60 * 1000;
  try { if (!subscribed && JSON.parse(localStorage.getItem(KEY) || "null")?.subscribed !== true) localStorage.setItem(KEY, JSON.stringify({ dismissedUntil })); } catch { /* In-memory fallback. */ }
}
export function newsletterSubscribed() {
  subscribed = true;
  try { localStorage.setItem(KEY, JSON.stringify({ subscribed: true })); } catch { /* In-memory fallback. */ }
  window.dispatchEvent(new Event(NEWSLETTER_SUCCESS));
}
