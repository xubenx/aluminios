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
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";

export default function ChapesPage() {
  const [chapes, setChapes] = useState([]);
  const [filteredChapes, setFilteredChapes] = useState([]); // Para herrajes filtrados
  const [models, setModels] = useState([]);
  const [chapeUsageCount, setChapeUsageCount] = useState({});
  const [searchText, setSearchText] = useState(""); // Texto de búsqueda
  const [editingPriceId, setEditingPriceId] = useState(null); // ID del herraje en edición
  const [editingPriceValue, setEditingPriceValue] = useState(""); // Valor del precio en edición
  const [openDialog, setOpenDialog] = useState(false);
  const [currentChape, setCurrentChape] = useState(null);
  const [formData, setFormData] = useState({ name: "", price: "" });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    fetchChapes();
    fetchModels();
  }, []);

  useEffect(() => {
    // Filtrar herrajes en base al texto de búsqueda
    const filtered = chapes.filter((chape) =>
      chape.name.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredChapes(filtered);
  }, [searchText, chapes]);

  useEffect(() => {
    calculateChapeUsage();
  }, [chapes, models]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchModels = async () => {
    try {
      const modelsSnapshot = await getDocs(collection(db, "models"));
      const modelsData = modelsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setModels(modelsData);
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  };

  const calculateChapeUsage = () => {
    const usageCount = {};
    
    // Inicializar contador para todos los herrajes
    chapes.forEach(chape => {
      usageCount[chape.id] = 0;
    });

    // Contar en cuántos modelos aparece cada herraje
    models.forEach(model => {
      if (model.chapes && Array.isArray(model.chapes)) {
        model.chapes.forEach(chapeRef => {
          // chapeRef puede ser un string (ID) o un objeto con id
          const chapeId = typeof chapeRef === 'string' ? chapeRef : chapeRef.id;
          if (chapeId && usageCount.hasOwnProperty(chapeId)) {
            usageCount[chapeId]++;
          }
        });
      }
    });

    setChapeUsageCount(usageCount);
  };

  const fetchChapes = async () => {
    const chapesSnapshot = await getDocs(collection(db, "chapes"));
    const chapesData = chapesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setChapes(chapesData);
    setFilteredChapes(chapesData); // Inicializar herrajes filtrados
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value); // Actualizar texto de búsqueda
  };

  const handlePriceDoubleClick = (id, price) => {
    setEditingPriceId(id); // Establece el ID del herraje en edición
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
      const chapeRef = doc(db, "chapes", editingPriceId);
      await updateDoc(chapeRef, { price: parseFloat(editingPriceValue) });
      setSnackbar({ open: true, message: "Precio actualizado correctamente.", severity: "success" });
      fetchChapes(); // Actualiza la lista de herrajes
    } catch (error) {
      console.error(error);
      setSnackbar({ open: true, message: "Error al actualizar el precio.", severity: "error" });
    } finally {
      setEditingPriceId(null); // Salir del modo de edición
    }
  };

  const handleOpenDialog = (chape = null) => {
    setCurrentChape(chape);
    setFormData(chape || { name: "", price: "" });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentChape(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.price.trim() || isNaN(formData.price)) {
      setSnackbar({ open: true, message: "Todos los campos son obligatorios y el precio debe ser un número.", severity: "error" });
      return;
    }

    try {
      if (currentChape) {
        await updateDoc(doc(db, "chapes", currentChape.id), { ...formData, price: parseFloat(formData.price) });
        setSnackbar({ open: true, message: "Herraje actualizado correctamente.", severity: "success" });
      } else {
        await addDoc(collection(db, "chapes"), { ...formData, price: parseFloat(formData.price) });
        setSnackbar({ open: true, message: "Herraje agregado correctamente.", severity: "success" });
      }
      fetchChapes();
      handleCloseDialog();
    } catch (error) {
      console.log(error);
      setSnackbar({ open: true, message: "Error al guardar el herraje.", severity: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de eliminar este herraje?")) {
      try {
        await deleteDoc(doc(db, "chapes", id));
        setSnackbar({ open: true, message: "Herraje eliminado correctamente.", severity: "success" });
        fetchChapes();
      } catch (error) {
        console.log(error);
        setSnackbar({ open: true, message: "Error al eliminar el herraje.", severity: "error" });
      }
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: "black" }}>
        Herrajes
      </Typography>

      {/* Buscador */}
      <TextField
        fullWidth
        label="Buscar Herraje"
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
                <TableCell><strong>Usado en Modelos</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredChapes.map((chape) => (
                <TableRow key={chape.id}>
                  <TableCell>{chape.name}</TableCell>
                  <TableCell
                    onDoubleClick={() => handlePriceDoubleClick(chape.id, chape.price)}
                  >
                    {editingPriceId === chape.id ? (
                      <TextField
                        value={editingPriceValue}
                        onChange={handlePriceChange}
                        onBlur={handlePriceBlur}
                        autoFocus
                        size="small"
                      />
                    ) : (
                      `$${chape.price}`
                    )}
                  </TableCell>
                  <TableCell>
                    <span style={{ 
                      backgroundColor: chapeUsageCount[chape.id] > 0 ? '#e8f5e8' : '#fff3e0', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      color: chapeUsageCount[chape.id] > 0 ? '#2e7d32' : '#f57c00',
                      fontWeight: 'bold'
                    }}>
                      {chapeUsageCount[chape.id] || 0} modelo{chapeUsageCount[chape.id] !== 1 ? 's' : ''}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      color="azulote"
                      startIcon={<Edit />}
                      onClick={() => handleOpenDialog(chape)}
                      sx={{ marginRight: "0.5rem" }}
                    >
                      Editar
                    </Button>
                    <Button
                      color="secondary"
                      startIcon={<Delete />}
                      onClick={() => handleDelete(chape.id)}
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
        <DialogTitle>{currentChape ? "Editar Herraje" : "Agregar Herraje"}</DialogTitle>
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