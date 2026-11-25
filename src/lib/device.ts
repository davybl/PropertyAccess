const DEVICE_HASH_KEY = "pa_device_hash";
const SESSION_TOKEN_KEY = "pa_session_token";

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let existing = window.localStorage.getItem(DEVICE_HASH_KEY);
  if (!existing) {
    existing =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `dev_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    window.localStorage.setItem(DEVICE_HASH_KEY, existing);
  }
  return existing;
}

export function getDeviceLabel(): string {
  if (typeof navigator === "undefined") return "Unknown Device";
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "Android Phone";
  if (/iPhone|iPad/i.test(ua)) return "iPhone / iPad";
  if (/Windows/i.test(ua)) return "Windows PC";
  if (/Mac/i.test(ua)) return "Mac";
  return "Web Browser";
}

export function saveSessionToken(token: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SESSION_TOKEN_KEY, token);
  }
}

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_TOKEN_KEY);
}

export function clearSessionToken(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_TOKEN_KEY);
  }
}
