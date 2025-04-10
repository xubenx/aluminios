"use client";
import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
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
  Box,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";

export default function GlassesPage() {
  const [glasses, setGlasses] = useState([]);
  const [filteredGlasses, setFilteredGlasses] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false); // Confirmación para eliminar
  const [currentGlass, setCurrentGlass] = useState(null);
  const [glassToDelete, setGlassToDelete] = useState(null); // Vidrio a eliminar
  const [formData, setFormData] = useState({
    name: "",
    options: [{ tickness: "", priceCost: "", priceCut: "", priceInstalled: "" }],
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    fetchGlasses();
  }, []);

  useEffect(() => {
    const filtered = glasses.filter((glass) =>
      glass.name.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredGlasses(filtered);
  }, [searchText, glasses]);

  const fetchGlasses = async () => {
    const glassesSnapshot = await getDocs(collection(db, "glasses"));
    const glassesData = glassesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setGlasses(glassesData);
    setFilteredGlasses(glassesData);
  };

  const handleInputChange = (e, index = null, field = null) => {
    if (index !== null && field) {
      const updatedOptions = [...formData.options];
      updatedOptions[index][field] = e.target.value;
      setFormData({ ...formData, options: updatedOptions });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleAddOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { tickness: "", priceCost: "", priceCut: "", priceInstalled: "" }],
    });
  };

  const handleRemoveOption = (index) => {
    const updatedOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: updatedOptions });
  };

  const handleOpenDialog = (glass = null) => {
    setCurrentGlass(glass);
    setFormData(
      glass || {
        name: "",
        options: [{ tickness: "", priceCost: "", priceCut: "", priceInstalled: "" }],
      }
    );
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentGlass(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || formData.options.some((opt) => !opt.tickness || !opt.priceCost || !opt.priceCut || !opt.priceInstalled)) {
      setSnackbar({ open: true, message: "Todos los campos son obligatorios y deben ser válidos.", severity: "error" });
      return;
    }

    try {
      if (currentGlass) {
        await updateDoc(doc(db, "glasses", currentGlass.id), formData);
        setSnackbar({ open: true, message: "Vidrio actualizado correctamente.", severity: "success" });
      } else {
        await addDoc(collection(db, "glasses"), formData);
        setSnackbar({ open: true, message: "Vidrio agregado correctamente.", severity: "success" });
      }
      fetchGlasses();
      handleCloseDialog();
    } catch (error) {
      console.log(error);
      setSnackbar({ open: true, message: "Error al guardar el vidrio.", severity: "error" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, "glasses", glassToDelete.id));
      setSnackbar({ open: true, message: "Vidrio eliminado correctamente.", severity: "success" });
      fetchGlasses();
      setOpenConfirmDialog(false);
    } catch (error) {
      console.log(error);
      setSnackbar({ open: true, message: "Error al eliminar el vidrio.", severity: "error" });
    }
  };

  const handleOpenConfirmDialog = (glass) => {
    setGlassToDelete(glass);
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setGlassToDelete(null);
  };

  return (
    <div style={{ padding: "1rem" }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: "black" }}>
        Vidrios
      </Typography>

      {/* Buscador */}
      <TextField
        fullWidth
        label="Buscar Vidrio"
        variant="outlined"
        margin="normal"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
      />

      <Paper elevation={3} sx={{ padding: "1rem", marginBottom: "1rem" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Opciones</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredGlasses.map((glass) => (
                <TableRow key={glass.id}>
                  <TableCell>{glass.name}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "1rem",
                      }}
                    >
                      {glass.options.map((opt, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            backgroundColor: "#f5f5f5",
                            padding: "0.5rem",
                            borderRadius: "8px",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          <Typography variant="body2">
                            <strong>Grosor:</strong> {opt.tickness} mm
                          </Typography>
                          <Typography variant="body2">
                            <strong>Costo:</strong> ${opt.priceCost}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Corte:</strong> ${opt.priceCut}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Instalado:</strong> ${opt.priceInstalled}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Button
                      color="azulote"
                      startIcon={<Edit />}
                      onClick={() => handleOpenDialog(glass)}
                      sx={{ marginRight: "0.5rem" }}
                    >
                      Editar
                    </Button>
                    <Button
                      color="secondary"
                      startIcon={<Delete />}
                      onClick={() => handleOpenConfirmDialog(glass)}
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

      {/* Dialog para CRUD */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{currentGlass ? "Editar Vidrio" : "Agregar Vidrio"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Nombre"
            type="text"
            fullWidth
            value={formData.name}
            onChange={handleInputChange}
          />
          {formData.options.map((option, index) => (
            <Box key={index} sx={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
              <TextField
                margin="dense"
                label="Grosor (mm)"
                type="number"
                value={option.tickness}
                onChange={(e) => handleInputChange(e, index, "tickness")}
                sx={{ marginRight: "1rem", flex: 1 }}
              />
              <TextField
                margin="dense"
                label="Precio al Costo"
                type="number"
                value={option.priceCost}
                onChange={(e) => handleInputChange(e, index, "priceCost")}
                sx={{ marginRight: "1rem", flex: 1 }}
              />
              <TextField
                margin="dense"
                label="Precio al Corte"
                type="number"
                value={option.priceCut}
                onChange={(e) => handleInputChange(e, index, "priceCut")}
                sx={{ marginRight: "1rem", flex: 1 }}
              />
              <TextField
                margin="dense"
                label="Precio Instalado"
                type="number"
                value={option.priceInstalled}
                onChange={(e) => handleInputChange(e, index, "priceInstalled")}
                sx={{ flex: 1 }}
              />
              <Button color="error" onClick={() => handleRemoveOption(index)} sx={{ marginLeft: "1rem" }}>
                Eliminar
              </Button>
            </Box>
          ))}
          <Button onClick={handleAddOption} color="azulote">
            Agregar Variante
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación */}
      <Dialog open={openConfirmDialog} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>¿Estás seguro de que deseas eliminar este vidrio?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancelar</Button>
          <Button onClick={handleDelete} color="secondary">
            Eliminar
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