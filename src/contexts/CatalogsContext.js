"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

// Cache de catalogos compartido por todo /sistema.
// Se cargan una sola vez y se reutilizan entre navegaciones (memoria + sessionStorage).
const TTL_MS = 10 * 60 * 1000;
const STORAGE_PREFIX = "aluminios-catalogs:";

const CATALOGS = [
  { key: "models", collectionName: "models" },
  { key: "materials", collectionName: "materials" },
  { key: "chapes", collectionName: "chapes" },
  { key: "glasses", collectionName: "glasses" },
  { key: "colors", collectionName: "colors" },
  { key: "extras", collectionName: "extras" },
  { key: "modelCollections", collectionName: "modelCollections" },
];

const EMPTY = {
  models: [],
  materials: [],
  chapes: [],
  glasses: [],
  colors: [],
  extras: [],
  modelCollections: [],
};

function normalizeDoc(key, docSnap) {
  const data = docSnap.data();
  if (key === "modelCollections") {
    return {
      id: docSnap.id,
      name: data.name || "",
      modelIds: Array.isArray(data.modelIds) ? data.modelIds : [],
    };
  }
  return { id: docSnap.id, ...data };
}

function readCache(key) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.timestamp !== "number") return null;
    if (Date.now() - parsed.timestamp > TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      STORAGE_PREFIX + key,
      JSON.stringify({ timestamp: Date.now(), data })
    );
  } catch {
    // sessionStorage no disponible o lleno: se ignora
  }
}

const CatalogsContext = createContext(null);

export function CatalogsProvider({ children }) {
  const [catalogs, setCatalogs] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (force = false) => {
    const next = { ...EMPTY };
    const toFetch = [];

    for (const entry of CATALOGS) {
      const cached = force ? null : readCache(entry.key);
      if (cached) {
        next[entry.key] = cached;
      } else {
        toFetch.push(entry);
      }
    }

    if (toFetch.length > 0) {
      try {
        const results = await Promise.all(
          toFetch.map(async (entry) => {
            const snap = await getDocs(collection(db, entry.collectionName));
            const data = snap.docs.map((d) => normalizeDoc(entry.key, d));
            writeCache(entry.key, data);
            return { key: entry.key, data };
          })
        );
        results.forEach(({ key, data }) => {
          next[key] = data;
        });
      } catch (error) {
        console.error("Error cargando catalogos:", error);
      }
    }

    setCatalogs(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const value = useMemo(
    () => ({ ...catalogs, loading, refresh: () => load(true) }),
    [catalogs, loading, load]
  );

  return <CatalogsContext.Provider value={value}>{children}</CatalogsContext.Provider>;
}

export function useCatalogs() {
  const ctx = useContext(CatalogsContext);
  if (!ctx) {
    throw new Error("useCatalogs debe usarse dentro de CatalogsProvider");
  }
  return ctx;
}
