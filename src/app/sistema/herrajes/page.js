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

export default function ChapesPage() {
  const [chapes, setChapes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentChape, setCurrentChape] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchChapes();
  }, []);

  const fetchChapes = async () => {
    const chapesSnapshot = await getDocs(collection(db, 'chapes'));
    setChapes(chapesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenDialog = (chape = null) => {
    setCurrentChape(chape);
    setFormData(chape || { name: '', price: '' });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentChape(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.price.trim() || isNaN(formData.price)) {
      setSnackbar({ open: true, message: 'Todos los campos son obligatorios y el precio debe ser un número.', severity: 'error' });
      return;
    }

    try {
      if (currentChape) {
        await updateDoc(doc(db, 'chapes', currentChape.id), formData);
        setSnackbar({ open: true, message: 'Accesorio actualizado correctamente.', severity: 'success' });
      } else {
        await addDoc(collection(db, 'chapes'), { ...formData, price: parseFloat(formData.price) });
        setSnackbar({ open: true, message: 'Accesorio agregado correctamente.', severity: 'success' });
      }
      fetchChapes();
      handleCloseDialog();
    } catch (error) {
      console.log(error);

      setSnackbar({ open: true, message: 'Error al guardar el accesorio.', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar este accesorio?')) {
      try {
        await deleteDoc(doc(db, 'chapes', id));
        setSnackbar({ open: true, message: 'Accesorio eliminado correctamente.', severity: 'success' });
        fetchChapes();
      } catch (error) {
        console.log(error);

        setSnackbar({ open: true, message: 'Error al eliminar el accesorio.', severity: 'error' });
      }
    }
  };

  return (
    <div>
      <h1>Accesorios</h1>
      <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
        Agregar Accesorio
      </Button>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Precio</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {chapes.map(chape => (
              <TableRow key={chape.id}>
                <TableCell>{chape.id}</TableCell>
                <TableCell>{chape.name}</TableCell>
                <TableCell>${chape.price}</TableCell>
                <TableCell>
                  <Button color="primary" onClick={() => handleOpenDialog(chape)}>
                    Editar
                  </Button>
                  <Button color="secondary" onClick={() => handleDelete(chape.id)}>
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
        <DialogTitle>{currentChape ? 'Editar Accesorio' : 'Agregar Accesorio'}</DialogTitle>
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