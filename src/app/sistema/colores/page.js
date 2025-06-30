"use client";
import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "../../../../firebase";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  Fab,
  Paper,
  Typography,
  Chip,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";

export default function ColorsPage() {
  const [colors, setColors] = useState([]);
  const [filteredColors, setFilteredColors] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [editingPercentageId, setEditingPercentageId] = useState(null);
  const [editingPercentageValue, setEditingPercentageValue] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [currentColor, setCurrentColor] = useState(null);
  const [formData, setFormData] = useState({ name: "", percentage: "0" });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    fetchColors();
  }, []);

  useEffect(() => {
    const filtered = colors.filter((color) =>
      color.name.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredColors(filtered);
  }, [searchText, colors]);

  const fetchColors = async () => {
    const colorsSnapshot = await getDocs(collection(db, "colors"));
    const colorsData = colorsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setColors(colorsData);
    setFilteredColors(colorsData);
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const handlePercentageDoubleClick = (id, percentage) => {
    setEditingPercentageId(id);
    setEditingPercentageValue(percentage);
  };

  const handlePercentageChange = (e) => {
    setEditingPercentageValue(e.target.value);
  };

  const handlePercentageBlur = async () => {
    if (isNaN(editingPercentageValue) || editingPercentageValue.trim() === "") {
      setSnackbar({ open: true, message: "El porcentaje debe ser un número válido.", severity: "error" });
      setEditingPercentageId(null);
      return;
    }

    try {
      const colorRef = doc(db, "colors", editingPercentageId);
      await updateDoc(colorRef, { percentage: parseFloat(editingPercentageValue) });
      setSnackbar({ open: true, message: "Porcentaje actualizado correctamente.", severity: "success" });
      fetchColors();
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: "Error al actualizar el porcentaje.", severity: "error" });
    } finally {
      setEditingPercentageId(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleOpenDialog = (color = null) => {
    setCurrentColor(color);
    setFormData(
      color || { name: "", percentage: "0" }
    );
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentColor(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.percentage.trim() || isNaN(formData.percentage)) {
      setSnackbar({ open: true, message: "Todos los campos son obligatorios y deben ser válidos.", severity: "error" });
      return;
    }

    try {
      if (currentColor) {
        await updateDoc(doc(db, "colors", currentColor.id), {
          ...formData,
          percentage: parseFloat(formData.percentage),
        });
        setSnackbar({ open: true, message: "Color actualizado correctamente.", severity: "success" });
      } else {
        await addDoc(collection(db, "colors"), {
          ...formData,
          percentage: parseFloat(formData.percentage),
        });
        setSnackbar({ open: true, message: "Color agregado correctamente.", severity: "success" });
      }
      fetchColors();
      handleCloseDialog();
    } catch (error) {
      console.log(error);
      setSnackbar({ open: true, message: "Error al guardar el color.", severity: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de eliminar este color?")) {
      try {
        await deleteDoc(doc(db, "colors", id));
        setSnackbar({ open: true, message: "Color eliminado correctamente.", severity: "success" });
        fetchColors();
      } catch (error) {
        console.log(error);
        setSnackbar({ open: true, message: "Error al eliminar el color.", severity: "error" });
      }
    }
  };

  const getPercentageChip = (percentage) => {
    const value = parseFloat(percentage);
    if (value === 0) {
      return <Chip label="Natural" color="default" size="small" />;
    } else if (value > 0) {
      return <Chip label={`+${value}%`} color="warning" size="small" />;
    } else {
      return <Chip label={`${value}%`} color="error" size="small" />;
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: "black" }}>
        Colores de Materiales
      </Typography>

      <Typography variant="body1" align="center" sx={{ mb: 3, color: "text.secondary" }}>
        Gestiona los colores disponibles y sus porcentajes de incremento sobre el precio base (natural)
      </Typography>

      {/* Buscador */}
      <TextField
        fullWidth
        label="Buscar Color"
        variant="outlined"
        margin="normal"
        value={searchText}
        onChange={handleSearchChange}
      />

      {/* Tabla */}
      <Paper elevation={3} sx={{ padding: "1rem", marginBottom: "1rem" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Nombre del Color</strong></TableCell>
                <TableCell><strong>Incremento</strong></TableCell>
                <TableCell><strong>Porcentaje</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredColors.map((color) => (
                <TableRow key={color.id}>
                  <TableCell>{color.name}</TableCell>
                  <TableCell>{getPercentageChip(color.percentage)}</TableCell>
                  <TableCell
                    onDoubleClick={() => handlePercentageDoubleClick(color.id, color.percentage)}
                  >
                    {editingPercentageId === color.id ? (
                      <TextField
                        value={editingPercentageValue}
                        onChange={handlePercentageChange}
                        onBlur={handlePercentageBlur}
                        autoFocus
                        size="small"
                        type="number"
                        inputProps={{ step: 0.1 }}
                      />
                    ) : (
                      `${color.percentage}%`
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      color="primary"
                      startIcon={<Edit />}
                      onClick={() => handleOpenDialog(color)}
                      sx={{ marginRight: "0.5rem" }}
                    >
                      Editar
                    </Button>
                    <Button
                      color="secondary"
                      startIcon={<Delete />}
                      onClick={() => handleDelete(color.id)}
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Botón flotante */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => handleOpenDialog()}
        sx={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
        }}
      >
        <Add />
      </Fab>

      {/* Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{currentColor ? "Editar Color" : "Agregar Color"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Nombre del Color"
            type="text"
            fullWidth
            value={formData.name}
            onChange={handleInputChange}
            helperText="Ej: Natural, Blanco, Negro, Café, etc."
          />
          <TextField
            margin="dense"
            name="percentage"
            label="Porcentaje de Incremento"
            type="number"
            fullWidth
            value={formData.percentage}
            onChange={handleInputChange}
            inputProps={{ step: 0.1 }}
            helperText="0 = precio natural, 10 = +10% sobre precio base, -5 = -5% sobre precio base"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
