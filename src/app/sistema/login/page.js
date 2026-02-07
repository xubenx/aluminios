"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Lock, Person } from "@mui/icons-material";
import { useAuth } from "../../../contexts/AuthContext";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../../../firebase";

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showFirstUser, setShowFirstUser] = useState(false);
  const [firstUserName, setFirstUserName] = useState("");
  const [firstUserUsuario, setFirstUserUsuario] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const snap = await getDocs(collection(db, "employees"));
      const withUsuario = snap.docs.some((d) => d.data().usuario);
      if (!withUsuario) setShowFirstUser(true); // No hay ningún usuario con usuario
    };
    check();
  }, []);

  const handleFirstUser = async (e) => {
    e.preventDefault();
    if (!firstUserName.trim() || !firstUserUsuario.trim() || !password.trim()) {
      setError("Nombre, usuario y contraseña son obligatorios.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await addDoc(collection(db, "employees"), {
        name: firstUserName.trim(),
        usuario: firstUserUsuario.trim().toLowerCase(),
        password: password.trim(),
        role: "admin",
      });
      const res = await login(firstUserUsuario, password);
      if (res.ok) router.replace("/sistema");
      else setError(res.error);
    } catch (err) {
      setError("Error al crear usuario.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await login(usuario, password);
      if (res.ok) {
        router.replace("/sistema");
      } else {
        setError(res.error || "Error al iniciar sesión");
      }
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (showFirstUser) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f5f5f5" }}>
        <Paper sx={{ p: 4, maxWidth: 400, width: "100%" }} elevation={3}>
          <Typography variant="h5" align="center" gutterBottom fontWeight="bold">Crear primer usuario</Typography>
          <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
            No hay usuarios. Crea el administrador inicial.
          </Typography>
          <form onSubmit={handleFirstUser}>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
            <TextField fullWidth label="Nombre" value={firstUserName} onChange={(e) => setFirstUserName(e.target.value)} margin="normal" required />
            <TextField fullWidth label="Usuario" value={firstUserUsuario} onChange={(e) => setFirstUserUsuario(e.target.value)} margin="normal" required placeholder="ej: jperez" />
            <TextField fullWidth label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" required />
            <Button type="submit" fullWidth variant="contained" size="large" disabled={submitting} sx={{ mt: 3 }}>{submitting ? <CircularProgress size={24} /> : "Crear y entrar"}</Button>
          </form>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f5f5f5",
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 400, width: "100%" }} elevation={3}>
        <Typography variant="h5" align="center" gutterBottom fontWeight="bold">
          Iniciar sesión
        </Typography>
        <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
          Sistema de Gestión - Aluminios San Francisco
        </Typography>

        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            margin="normal"
            required
            autoComplete="username"
            placeholder="ej: jperez"
            InputProps={{ startAdornment: <Person sx={{ mr: 1, color: "grey" }} /> }}
          />
          <TextField
            fullWidth
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
            autoComplete="current-password"
            InputProps={{ startAdornment: <Lock sx={{ mr: 1, color: "grey" }} /> }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={submitting}
            sx={{ mt: 3, mb: 2 }}
          >
            {submitting ? <CircularProgress size={24} /> : "Entrar"}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
