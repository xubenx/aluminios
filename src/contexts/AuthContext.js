"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signInWithCustomToken, signOut } from "firebase/auth";
import { getFirebaseAuth } from "../../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const token = await firebaseUser.getIdTokenResult();
        const role = token.claims.role;
        if (role !== "admin" && role !== "auxiliar" && role !== "colaborador") {
          await signOut(getFirebaseAuth());
          setUser(null);
          setLoading(false);
          return;
        }
        setUser({
          userId: token.claims.employeeId || firebaseUser.uid,
          usuario: token.claims.usuario || "",
          name: token.claims.name || "",
          role,
        });
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (usuario, password) => {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, error: data.message || "No se pudo iniciar sesión." };
    }
    await signInWithCustomToken(getFirebaseAuth(), data.token);
    return { ok: true };
  };

  const logout = async () => {
    await signOut(getFirebaseAuth());
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
