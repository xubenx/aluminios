"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { homeForRole } from "../../../lib/roles";
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

export default function LoginPage() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await login(usuario, password);
      if (res.ok) {
        router.replace(homeForRole(res.role));
      } else {
        setError(res.error || "Error al iniciar sesión");
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

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
