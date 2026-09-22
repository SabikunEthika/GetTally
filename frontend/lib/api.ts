export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("gettally_token");
}

export function saveSession(token: string, seller: unknown) {
  window.localStorage.setItem("gettally_token", token);
  window.localStorage.setItem("gettally_seller", JSON.stringify(seller));
}

export function clearSession() {
  window.localStorage.removeItem("gettally_token");
  window.localStorage.removeItem("gettally_seller");
}

export async function logout() {
  try { await apiFetch("/api/auth/logout", { method: "POST" }); } finally { clearSession(); }
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type") && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  return fetch(`${API}${path}`, { ...init, headers });
}
