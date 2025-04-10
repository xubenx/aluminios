"use client";
import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc, deleteDoc, addDoc } from "firebase/firestore"; // Se agregó `deleteDoc` y `addDoc` porque se usan en el código
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
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [editingPriceId, setEditingPriceId] = useState(null); // ID del material en edición
  const [editingPriceValue, setEditingPriceValue] = useState(""); // Valor del precio en edición
  const [openDialog, setOpenDialog] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState(null);
  const [formData, setFormData] = useState({ name: "", price: "", stretch: "" });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    const filtered = materials.filter((material) =>
      material.name.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredMaterials(filtered);
  }, [searchText, materials]);

  const fetchMaterials = async () => {
    const materialsSnapshot = await getDocs(collection(db, "materials"));
    const materialsData = materialsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setMaterials(materialsData);
    setFilteredMaterials(materialsData);
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const handlePriceDoubleClick = (id, price) => {
    setEditingPriceId(id); // Establece el ID del material en edición
    setEditingPriceValue(price); // Establece el valor actual del precio
  };

  const handlePriceChange = (e) => {
    setEditingPriceValue(e.target.value); // Actualiza el valor del precio en edición
  };

  const handlePriceBlur = async () => {
    if (isNaN(editingPriceValue) || editingPriceValue.trim() === "") {
      setSnackbar({ open: true, message: "El precio debe ser un número válido.", severity: "error" });
      setEditingPriceId(null); // Salir del modo de edición
      return;
    }

    try {
      const materialRef = doc(db, "materials", editingPriceId);
      await updateDoc(materialRef, { price: parseFloat(editingPriceValue) });
      setSnackbar({ open: true, message: "Precio actualizado correctamente.", severity: "success" });
      fetchMaterials(); // Actualiza la lista de materiales
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: "Error al actualizar el precio.", severity: "error" });
    } finally {
      setEditingPriceId(null); // Salir del modo de edición
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleOpenDialog = (material = null) => {
    setCurrentMaterial(material);
    setFormData(
      material || { name: "", price: "", stretch: "6.1" } // Valor por defecto para stretch
    );
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentMaterial(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.price.trim() || isNaN(formData.price) || !formData.stretch.trim() || isNaN(formData.stretch)) {
      setSnackbar({ open: true, message: "Todos los campos son obligatorios y deben ser válidos.", severity: "error" });
      return;
    }

    try {
      if (currentMaterial) {
        await updateDoc(doc(db, "materials", currentMaterial.id), {
          ...formData,
          price: parseFloat(formData.price),
          stretch: parseFloat(formData.stretch),
        });
        setSnackbar({ open: true, message: "Material actualizado correctamente.", severity: "success" });
      } else {
        await addDoc(collection(db, "materials"), {
          ...formData,
          price: parseFloat(formData.price),
          stretch: parseFloat(formData.stretch),
        });
        setSnackbar({ open: true, message: "Material agregado correctamente.", severity: "success" });
      }
      fetchMaterials();
      handleCloseDialog();
    } catch (error) {
      console.log(error);
      setSnackbar({ open: true, message: "Error al guardar el material.", severity: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de eliminar este material?")) {
      try {
        await deleteDoc(doc(db, "materials", id));
        setSnackbar({ open: true, message: "Material eliminado correctamente.", severity: "success" });
        fetchMaterials();
      } catch (error) {
        console.log(error);
        setSnackbar({ open: true, message: "Error al eliminar el material.", severity: "error" });
      }
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: "black" }}>
        Materiales
      </Typography>

      {/* Buscador */}
      <TextField
        fullWidth
        label="Buscar Material"
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
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Precio</strong></TableCell>
                <TableCell><strong>Longitud</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMaterials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell>{material.name}</TableCell>
                  <TableCell
                    onDoubleClick={() => handlePriceDoubleClick(material.id, material.price)}
                  >
                    {editingPriceId === material.id ? (
                      <TextField
                        value={editingPriceValue}
                        onChange={handlePriceChange}
                        onBlur={handlePriceBlur}
                        autoFocus
                        size="small"
                      />
                    ) : (
                      `$${material.price}`
                    )}
                  </TableCell>
                  <TableCell>{material.stretch} m</TableCell>
                  <TableCell>
                    <Button
                      color="azulote"
                      startIcon={<Edit />}
                      onClick={() => handleOpenDialog(material)}
                      sx={{ marginRight: "0.5rem" }}
                    >
                      Editar
                    </Button>
                    <Button
                      color="secondary"
                      startIcon={<Delete />}
                      onClick={() => handleDelete(material.id)}
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
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{currentMaterial ? "Editar Material" : "Agregar Material"}</DialogTitle>
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
          <TextField
            margin="dense"
            name="price"
            label="Precio"
            type="number"
            fullWidth
            value={formData.price}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="stretch"
            label="Longitud (m)"
            type="number"
            fullWidth
            value={formData.stretch}
            onChange={handleInputChange}
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