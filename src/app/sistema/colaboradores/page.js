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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const employeesSnapshot = await getDocs(collection(db, 'employees'));
    setEmployees(employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenDialog = (employee = null) => {
    setCurrentEmployee(employee);
    setFormData(employee || { name: '' });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentEmployee(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setSnackbar({ open: true, message: 'El nombre es obligatorio.', severity: 'error' });
      return;
    }

    try {
      if (currentEmployee) {
        await updateDoc(doc(db, 'employees', currentEmployee.id), formData);
        setSnackbar({ open: true, message: 'Empleado actualizado correctamente.', severity: 'success' });
      } else {
        await addDoc(collection(db, 'employees'), formData);
        setSnackbar({ open: true, message: 'Empleado agregado correctamente.', severity: 'success' });
      }
      fetchEmployees();
      handleCloseDialog();
    } catch (error) {
      console.log(error);

      setSnackbar({ open: true, message: 'Error al guardar el empleado.', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar este empleado?')) {
      try {
        await deleteDoc(doc(db, 'employees', id));
        setSnackbar({ open: true, message: 'Empleado eliminado correctamente.', severity: 'success' });
        fetchEmployees();
      } catch (error) {
        console.log(error);

        setSnackbar({ open: true, message: 'Error al eliminar el empleado.', severity: 'error' });
      }
    }
  };

  return (
    <div>
      <h1>Empleados</h1>
      <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
        Agregar Empleado
      </Button>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map(employee => (
              <TableRow key={employee.id}>
                <TableCell>{employee.id}</TableCell>
                <TableCell>{employee.name}</TableCell>
                <TableCell>
                  <Button color="primary" onClick={() => handleOpenDialog(employee)}>
                    Editar
                  </Button>
                  <Button color="secondary" onClick={() => handleDelete(employee.id)}>
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
        <DialogTitle>{currentEmployee ? 'Editar Empleado' : 'Agregar Empleado'}</DialogTitle>
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