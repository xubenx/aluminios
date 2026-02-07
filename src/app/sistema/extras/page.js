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
  Snackbar,
  Alert,
  Fab,
  Paper,
  Typography,
} from "@mui/material";
import CrudStepperDialog from "../components/CrudStepperDialog";
import { Add, Edit, Delete } from "@mui/icons-material";

export default function ExtrasPage() {
  const [extras, setExtras] = useState([]);
  const [filteredExtras, setFilteredExtras] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [editingPriceValue, setEditingPriceValue] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [currentExtra, setCurrentExtra] = useState(null);
  const [formData, setFormData] = useState({ name: "", price: "" });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    fetchExtras();
  }, []);

  useEffect(() => {
    const filtered = extras.filter((extra) =>
      extra.name.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredExtras(filtered);
  }, [searchText, extras]);

  const fetchExtras = async () => {
    const snapshot = await getDocs(collection(db, "extras"));
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    setExtras(data);
    setFilteredExtras(data);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  const handlePriceDoubleClick = (id, price) => {
    setEditingPriceId(id);
    setEditingPriceValue(price);
  };

  const handlePriceChange = (e) => {
    setEditingPriceValue(e.target.value);
  };

  const handlePriceBlur = async () => {
    if (isNaN(editingPriceValue) || editingPriceValue.trim() === "") {
      setSnackbar({ open: true, message: "El precio debe ser un número válido.", severity: "error" });
      setEditingPriceId(null);
      return;
    }
    try {
      const ref = doc(db, "extras", editingPriceId);
      await updateDoc(ref, { price: parseFloat(editingPriceValue) });
      setSnackbar({ open: true, message: "Precio actualizado correctamente.", severity: "success" });
      fetchExtras();
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: "Error al actualizar el precio.", severity: "error" });
    } finally {
      setEditingPriceId(null);
    }
  };

  const handleOpenDialog = (extra = null) => {
    setCurrentExtra(extra);
    setFormData(extra || { name: "", price: "" });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentExtra(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.price.trim() || isNaN(formData.price)) {
      setSnackbar({ open: true, message: "Nombre y precio son obligatorios y el precio debe ser un número.", severity: "error" });
      return;
    }
    try {
      if (currentExtra) {
        await updateDoc(doc(db, "extras", currentExtra.id), { ...formData, price: parseFloat(formData.price) });
        setSnackbar({ open: true, message: "Servicio/Extra actualizado correctamente.", severity: "success" });
      } else {
        await addDoc(collection(db, "extras"), { ...formData, price: parseFloat(formData.price) });
        setSnackbar({ open: true, message: "Servicio/Extra agregado correctamente.", severity: "success" });
      }
      fetchExtras();
      handleCloseDialog();
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: "Error al guardar.", severity: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este servicio/extra?")) return;
    try {
      await deleteDoc(doc(db, "extras", id));
      setSnackbar({ open: true, message: "Servicio/Extra eliminado correctamente.", severity: "success" });
      fetchExtras();
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: "Error al eliminar.", severity: "error" });
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: "black" }}>
        Servicios o Extras
      </Typography>
      <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 2 }}>
        Cargos adicionales como gasolina, pintura, etc. Se usan en presupuestos y proyectos.
      </Typography>

      <TextField
        fullWidth
        label="Buscar Servicio/Extra"
        variant="outlined"
        margin="normal"
        value={searchText}
        onChange={handleSearchChange}
      />

      <Paper elevation={3} sx={{ padding: "1rem", marginBottom: "1rem" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Precio</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredExtras.map((extra) => (
                <TableRow key={extra.id}>
                  <TableCell>{extra.name}</TableCell>
                  <TableCell
                    onDoubleClick={() => handlePriceDoubleClick(extra.id, extra.price)}
                  >
                    {editingPriceId === extra.id ? (
                      <TextField
                        value={editingPriceValue}
                        onChange={handlePriceChange}
                        onBlur={handlePriceBlur}
                        autoFocus
                        size="small"
                      />
                    ) : (
                      `$${Number(extra.price) || 0}`
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      color="azulote"
                      startIcon={<Edit />}
                      onClick={() => handleOpenDialog(extra)}
                      sx={{ marginRight: "0.5rem" }}
                    >
                      Editar
                    </Button>
                    <Button
                      color="secondary"
                      startIcon={<Delete />}
                      onClick={() => handleDelete(extra.id)}
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

      <Fab
        color="primary"
        aria-label="add"
        onClick={() => handleOpenDialog()}
        sx={{ position: "fixed", bottom: "2rem", right: "2rem" }}
      >
        <Add />
      </Fab>

      <CrudStepperDialog
        open={openDialog}
        onClose={handleCloseDialog}
        title={currentExtra ? "Editar Servicio/Extra" : "Agregar Servicio/Extra"}
        steps={[
          {
            label: "Información",
            content: (
              <>
                <TextField
                  autoFocus
                  margin="dense"
                  name="name"
                  label="Nombre"
                  type="text"
                  fullWidth
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ej: Gasolina, Pintura, Flete"
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
              </>
            ),
          },
        ]}
        onSave={handleSave}
      />

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
