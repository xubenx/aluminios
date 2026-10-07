"use client";
import React, { useState } from "react";
import { Box, Paper, Typography, ToggleButton, ToggleButtonGroup, Divider } from "@mui/material";
import DrawingView from "./DrawingView";
import { formatCota } from "../../utils/drawing";

const SCALES = [
  { value: "fit", label: "Ajustar" },
  { value: 10, label: "1:10" },
  { value: 20, label: "1:20" },
  { value: 50, label: "1:50" },
  { value: 1, label: "1:1" },
];

/**
 * Plano imprimible: drawing + bloque de titulo + selector de escala.
 * En impresion solo se muestra el bloque .wo-print (ver globals.css).
 */
export default function WorkOrderDrawing({
  drawing,
  widthCm,
  heightCm,
  meta = {},
  defaultScale = "fit",
  showScaleSelector = true,
}) {
  const [scale, setScale] = useState(defaultScale);
  const W = Number(widthCm) > 0 ? Number(widthCm) : drawing?.baseDimension?.width || 100;
  const H = Number(heightCm) > 0 ? Number(heightCm) : drawing?.baseDimension?.height || 100;
  const physicalWidth = scale === "fit" ? "100%" : `${W / scale}cm`;

  if (!drawing) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography color="text.secondary">Este modelo aun no tiene un dibujo en el Studio.</Typography>
      </Paper>
    );
  }

  return (
    <Box className="wo-print">
      {showScaleSelector && (
        <Box className="wo-no-print" sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Escala
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={scale}
            onChange={(_, v) => v !== null && setScale(v)}
          >
            {SCALES.map((s) => (
              <ToggleButton key={s.value} value={s.value}>
                {s.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      )}

      <Paper variant="outlined" sx={{ p: 1, bgcolor: "#fff" }}>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Box sx={{ width: physicalWidth, maxWidth: "100%" }}>
            <DrawingView drawing={drawing} widthCm={W} heightCm={H} />
          </Box>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Bloque de titulo */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr 1fr" },
            gap: 1,
            fontSize: 13,
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Empresa
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {meta.company || "Aluminio San Francisco"}
            </Typography>
            <Typography variant="body2">{meta.modelName || meta.itemName || "Modelo"}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Medidas
            </Typography>
            <Typography variant="body2">
              {formatCota(W)} x {formatCota(H)} cm
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Escala: {scale === "fit" ? "ajustar" : `1:${scale}`}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Trabajo
            </Typography>
            <Typography variant="body2">Cliente: {meta.client || "-"}</Typography>
            <Typography variant="body2">Proyecto: {meta.projectName || "-"}</Typography>
            <Typography variant="body2">Fecha: {meta.date || new Date().toLocaleDateString()}</Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
