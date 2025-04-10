"use client";
import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../../firebase";
import {
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  Typography,
  Box,
  Fab,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [formData, setFormData] = useState({ name: "" });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const employeesSnapshot = await getDocs(collection(db, "employees"));
    setEmployees(employeesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenDialog = (employee = null) => {
    setCurrentEmployee(employee);
    setFormData(employee || { name: "" });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentEmployee(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setSnackbar({ open: true, message: "El nombre es obligatorio.", severity: "error" });
      return;
    }

    try {
      if (currentEmployee) {
        await updateDoc(doc(db, "employees", currentEmployee.id), formData);
        setSnackbar({ open: true, message: "Empleado actualizado correctamente.", severity: "success" });
      } else {
        await addDoc(collection(db, "employees"), formData);
        setSnackbar({ open: true, message: "Empleado agregado correctamente.", severity: "success" });
      }
      fetchEmployees();
      handleCloseDialog();
    } catch (error) {
      console.log(error);
      setSnackbar({ open: true, message: "Error al guardar el empleado.", severity: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de eliminar este empleado?")) {
      try {
        await deleteDoc(doc(db, "employees", id));
        setSnackbar({ open: true, message: "Empleado eliminado correctamente.", severity: "success" });
        fetchEmployees();
      } catch (error) {
        console.log(error);
        setSnackbar({ open: true, message: "Error al eliminar el empleado.", severity: "error" });
      }
    }
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4" align="center" sx={{ mb: 4, color: "black" }}>
        Colaboradores
      </Typography>

      {/* Botón flotante para agregar empleado */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => handleOpenDialog()}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <Add />
      </Fab>

      {/* Grid de empleados */}
      <Grid container spacing={3}>
        {employees.map((employee) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={employee.id}>
            <Card sx={{ boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: "black", mb: 2 }}>
                  {employee.name}
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Button
                    color="primary"
                    startIcon={<Edit />}
                    onClick={() => handleOpenDialog(employee)}
                  >
                    Editar
                  </Button>
                  <Button
                    color="secondary"
                    startIcon={<Delete />}
                    onClick={() => handleDelete(employee.id)}
                  >
                    Eliminar
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{currentEmployee ? "Editar Colaborador" : "Agregar Colaborador"}</DialogTitle>
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
          <Button onClick={handleSave} variant="contained" color="primary">
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
    </Box>
  );
}