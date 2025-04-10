"use client";

import React, { useState } from "react";
import { Grid, Typography, TextField, Button, Paper, Box } from "@mui/material";

export default function OrdersPage() {
  const [client, setClient] = useState("");
  const [date, setDate] = useState("");
  const [model, setModel] = useState("");
  const [manpower, setManpower] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [color, setColor] = useState("");

  const handleSaveOrder = () => {
    if (!client || !date || !model || !manpower || !width || !height || !color) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    const order = {
      client,
      date,
      model,
      manpower,
      dimensions: { width, height },
      color,
    };

    console.log("Orden guardada:", order);
    alert("Orden guardada exitosamente.");
    // Aquí puedes agregar la lógica para guardar la orden en Firebase
  };

  return (
    <Box sx={{ padding: 3, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
      {/* Título */}
                  <Typography variant="h4" align="center" gutterBottom sx={{ color: "black" }}>
                    Crear Orden
                  </Typography>

      {/* Contenido */}
      <Grid container spacing={3} columns={12}>
        {/* Sección Superior Izquierda */}
        <Grid sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
          <Paper elevation={3} sx={{ padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              Cliente y Fecha
            </Typography>
            <TextField
              fullWidth
              label="Cliente"
              variant="outlined"
              margin="normal"
              value={client}
              onChange={(e) => setClient(e.target.value)}
            />
            <TextField
              fullWidth
              type="date"
              label="Fecha"
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              margin="normal"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Paper>
        </Grid>

        {/* Sección Superior Derecha */}
        <Grid sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
          <Paper elevation={3} sx={{ padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              Modelo y Mano de Obra
            </Typography>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ marginBottom: 2 }}
              onClick={() => setModel("Modelo Seleccionado")}
            >
              Seleccionar Modelo
            </Button>
            <TextField
              fullWidth
              label="Mano de Obra"
              type="number"
              variant="outlined"
              margin="normal"
              value={manpower}
              onChange={(e) => setManpower(e.target.value)}
            />
          </Paper>
        </Grid>

        {/* Sección Media Izquierda */}
        <Grid sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
          <Paper elevation={3} sx={{ padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              Dimensiones
            </Typography>
            <TextField
              fullWidth
              label="Ancho"
              type="number"
              variant="outlined"
              margin="normal"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
            />
            <TextField
              fullWidth
              label="Alto"
              type="number"
              variant="outlined"
              margin="normal"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
            <TextField
              fullWidth
              label="Color"
              variant="outlined"
              margin="normal"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </Paper>
        </Grid>

        {/* Sección Media Derecha */}
        <Grid sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
          <Paper elevation={3} sx={{ padding: 2 }}>
            <Typography variant="h6" gutterBottom>
              Gráfico
            </Typography>
            <Box
              sx={{
                height: 200,
                bgcolor: "#e0e0e0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Aquí va el gráfico
            </Box>
          </Paper>
        </Grid>

        {/* Sección Inferior */}
        <Grid sx={{ gridColumn: "span 12" }}>
          <Paper elevation={3} sx={{ padding: 2, textAlign: "center" }}>
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={handleSaveOrder}
            >
              Guardar Orden
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}