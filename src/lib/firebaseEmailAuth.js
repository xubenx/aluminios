export function authEmailForUsuario(usuario, projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  return `${usuario}@${projectId || "aluminios"}.firebaseapp.com`;
}

async function identityRequest(method, body) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error("Falta NEXT_PUBLIC_FIREBASE_API_KEY");
  }
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:${method}?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, returnSecureToken: true }),
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error?.message || "Firebase Auth rechazó el acceso");
    error.code = data.error?.message || "AUTH_ERROR";
    throw error;
  }
  return data;
}

export async function ensureEmailPasswordUser(email, password) {
  try {
    await identityRequest("signInWithPassword", { email, password });
    return;
  } catch (error) {
    const code = String(error.code || "");
    const missing =
      code.includes("EMAIL_NOT_FOUND") ||
      code.includes("INVALID_LOGIN_CREDENTIALS") ||
      code.includes("INVALID_PASSWORD");
    if (!missing) throw error;
  }

  try {
    await identityRequest("signUp", { email, password });
  } catch (error) {
    const code = String(error.code || "");
    if (code.includes("WEAK_PASSWORD")) {
      const weak = new Error("La contraseña debe tener al menos 6 caracteres.");
      weak.code = "WEAK_PASSWORD";
      throw weak;
    }
    if (code.includes("EMAIL_EXISTS")) {
      const mismatch = new Error(
        "Esa cuenta ya existe en Firebase con otra contraseña. Hay que restablecerla desde la consola de Firebase."
      );
      mismatch.code = "EMAIL_EXISTS";
      throw mismatch;
    }
    throw error;
  }
}
