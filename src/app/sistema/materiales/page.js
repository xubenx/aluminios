"use client";
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../../firebase';
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
} from '@mui/material';

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', stretch: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    const materialsSnapshot = await getDocs(collection(db, 'materials'));
    setMaterials(materialsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenDialog = (material = null) => {
    setCurrentMaterial(material);
    setFormData(material || { name: '', price: '', stretch: '' });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentMaterial(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.price.trim() || isNaN(formData.price) || !formData.stretch.trim() || isNaN(formData.stretch)) {
      setSnackbar({ open: true, message: 'Todos los campos son obligatorios y deben ser válidos.', severity: 'error' });
      return;
    }

    try {
      if (currentMaterial) {
        await updateDoc(doc(db, 'materials', currentMaterial.id), {
          ...formData,
          price: parseFloat(formData.price),
          stretch: parseFloat(formData.stretch),
        });
        setSnackbar({ open: true, message: 'Material actualizado correctamente.', severity: 'success' });
      } else {
        await addDoc(collection(db, 'materials'), {
          ...formData,
          price: parseFloat(formData.price),
          stretch: parseFloat(formData.stretch),
        });
        setSnackbar({ open: true, message: 'Material agregado correctamente.', severity: 'success' });
      }
      fetchMaterials();
      handleCloseDialog();
    } catch (error) {
      console.log(error);

      setSnackbar({ open: true, message: 'Error al guardar el material.', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar este material?')) {
      try {
        await deleteDoc(doc(db, 'materials', id));
        setSnackbar({ open: true, message: 'Material eliminado correctamente.', severity: 'success' });
        fetchMaterials();
      } catch (error) {
        console.log(error);

        setSnackbar({ open: true, message: 'Error al eliminar el material.', severity: 'error' });
      }
    }
  };

  return (
    <div>
      <h1>Materiales</h1>
      <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
        Agregar Material
      </Button>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Precio</TableCell>
              <TableCell>Longitud</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {materials.map(material => (
              <TableRow key={material.id}>
                <TableCell>{material.id}</TableCell>
                <TableCell>{material.name}</TableCell>
                <TableCell>${material.price}</TableCell>
                <TableCell>{material.stretch} m</TableCell>
                <TableCell>
                  <Button color="primary" onClick={() => handleOpenDialog(material)}>
                    Editar
                  </Button>
                  <Button color="secondary" onClick={() => handleDelete(material.id)}>
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
        <DialogTitle>{currentMaterial ? 'Editar Material' : 'Agregar Material'}</DialogTitle>
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