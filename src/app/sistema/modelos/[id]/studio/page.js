"use client";
import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../../../../firebase";
import { Box, CircularProgress, Alert, Snackbar } from "@mui/material";
import { useRouter } from "next/navigation";
import StudioEditor from "../../../../../components/studio/StudioEditor";

export default function ModelStudioPage({ params }) {
  const [id, setId] = useState(null);
  const [model, setModel] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const router = useRouter();

  useEffect(() => {
    async function unwrapParams() {
      const unwrapped = await params;
      setId(unwrapped.id);
    }
    unwrapParams();
  }, [params]);

  useEffect(() => {
    const fetchModel = async () => {
      if (!id) return;
      const snap = await getDoc(doc(db, "models", id));
      if (snap.exists()) {
        setModel({ id: snap.id, ...snap.data() });
      } else {
        setNotFound(true);
      }
    };
    fetchModel();
  }, [id]);

  const handleSave = async (drawing) => {
    if (!id) return;
    try {
      setSaving(true);
      await updateDoc(doc(db, "models", id), { drawing });
      setModel((prev) => ({ ...prev, drawing }));
      setSnackbar({ open: true, message: "Dibujo guardado correctamente.", severity: "success" });
    } catch (error) {
      console.error("Error guardando el dibujo:", error);
      setSnackbar({ open: true, message: "Error al guardar el dibujo.", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (notFound) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Modelo no encontrado.</Alert>
      </Box>
    );
  }

  if (!model) {
    return (
      <Box sx={{ p: 6, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <StudioEditor
        initialDrawing={model.drawing}
        modelName={model.name || "Modelo"}
        saving={saving}
        onSave={handleSave}
        onBack={() => router.push(`/sistema/modelos/${id}`)}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
