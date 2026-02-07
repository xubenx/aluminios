"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

const SESSION_KEY = "aluminios_session";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restaurar sesión desde localStorage al cargar
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(SESSION_KEY) : null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.userId) setUser(parsed);
      } catch (e) {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (usuario, password) => {
    const q = query(
      collection(db, "employees"),
      where("usuario", "==", (usuario || "").trim().toLowerCase())
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return { ok: false, error: "Usuario no registrado." };
    const doc = snapshot.docs[0];
    const data = doc.data();
    if (String(data.password || "") !== String(password)) {
      return { ok: false, error: "Contraseña incorrecta." };
    }
    const session = {
      userId: doc.id,
      usuario: data.usuario,
      name: data.name || data.displayName || "",
      role: data.role || "colaborador",
      permissions: data.permissions || [],
    };
    setUser(session);
    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
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
