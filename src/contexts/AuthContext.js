"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signInWithCustomToken, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, getFirebaseAuth } from "../../firebase";
import { isRole } from "../lib/roles";

const AuthContext = createContext(null);

async function profileFromFirebaseUser(firebaseUser) {
  const token = await firebaseUser.getIdTokenResult();
  if (isRole(token.claims.role)) {
    return {
      userId: token.claims.employeeId || firebaseUser.uid,
      usuario: token.claims.usuario || "",
      name: token.claims.name || "",
      role: token.claims.role,
    };
  }

  const usuario = String(firebaseUser.email || "").split("@")[0].toLowerCase();
  if (!usuario) return null;
  const snapshot = await getDocs(query(collection(db, "employees"), where("usuario", "==", usuario)));
  if (snapshot.empty) return null;
  const employee = snapshot.docs[0];
  const data = employee.data();
  if (!isRole(data.role)) return null;
  return {
    userId: employee.id,
    usuario: data.usuario || usuario,
    name: data.name || data.displayName || usuario,
    role: data.role,
  };
}

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
        const profile = await profileFromFirebaseUser(firebaseUser);
        if (!profile) {
          await signOut(getFirebaseAuth());
          setUser(null);
          setLoading(false);
          return;
        }
        setUser(profile);
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
    if (data.token) {
      await signInWithCustomToken(getFirebaseAuth(), data.token);
    } else {
      await signInWithEmailAndPassword(getFirebaseAuth(), data.email, password);
    }
    return { ok: true, role: data.role };
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
