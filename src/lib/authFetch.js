import { getFirebaseAuth } from "../../firebase";

export async function authFetch(url, options = {}) {
  const current = getFirebaseAuth().currentUser;
  if (!current) {
    throw new Error("Sesión no iniciada");
  }
  const token = await current.getIdToken();
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...options, headers });
}
