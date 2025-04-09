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
} from "@mui/material";

export default function GlassesPage() {
  const [glasses, setGlasses] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentGlass, setCurrentGlass] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    options: [{ tickness: "", priceCost: "", priceCut: "", priceInstalled: "" }],
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    fetchGlasses();
  }, []);

  const fetchGlasses = async () => {
    const glassesSnapshot = await getDocs(collection(db, "glasses"));
    setGlasses(glassesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const handleInputChange = (e, index = null, field = null) => {
    if (index !== null && field) {
      // Update specific option
      const updatedOptions = [...formData.options];
      updatedOptions[index][field] = e.target.value;
      setFormData({ ...formData, options: updatedOptions });
    } else {
      // Update general field
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

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de eliminar este vidrio?")) {
      try {
        await deleteDoc(doc(db, "glasses", id));
        setSnackbar({ open: true, message: "Vidrio eliminado correctamente.", severity: "success" });
        fetchGlasses();
      } catch (error) {
        console.log(error);

        setSnackbar({ open: true, message: "Error al eliminar el vidrio.", severity: "error" });
      }
    }
  };

  return (
    <div>
      <h1>Vidrios</h1>
      <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
        Agregar Vidrio
      </Button>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Opciones</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {glasses.map((glass) => (
              <TableRow key={glass.id}>
                <TableCell>{glass.id}</TableCell>
                <TableCell>{glass.name}</TableCell>
                <TableCell>
                  {glass.options.map((opt, index) => (
                    <div key={index}>
                      {opt.tickness}mm - Costo: ${opt.priceCost}, Corte: ${opt.priceCut}, Instalado: ${opt.priceInstalled}
                    </div>
                  ))}
                </TableCell>
                <TableCell>
                  <Button color="primary" onClick={() => handleOpenDialog(glass)}>
                    Editar
                  </Button>
                  <Button color="secondary" onClick={() => handleDelete(glass.id)}>
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog */}
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
            <div key={index} style={{ marginBottom: "1rem" }}>
              <TextField
                margin="dense"
                label="Grosor (mm)"
                type="number"
                value={option.tickness}
                onChange={(e) => handleInputChange(e, index, "tickness")}
                style={{ marginRight: "1rem" }}
              />
              <TextField
                margin="dense"
                label="Precio al Costo"
                type="number"
                value={option.priceCost}
                onChange={(e) => handleInputChange(e, index, "priceCost")}
                style={{ marginRight: "1rem" }}
              />
              <TextField
                margin="dense"
                label="Precio al Corte"
                type="number"
                value={option.priceCut}
                onChange={(e) => handleInputChange(e, index, "priceCut")}
                style={{ marginRight: "1rem" }}
              />
              <TextField
                margin="dense"
                label="Precio Instalado"
                type="number"
                value={option.priceInstalled}
                onChange={(e) => handleInputChange(e, index, "priceInstalled")}
              />
              <Button color="error" onClick={() => handleRemoveOption(index)}>
                Eliminar
              </Button>
            </div>
          ))}
          <Button onClick={handleAddOption} color="primary">
            Agregar Opción
          </Button>
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