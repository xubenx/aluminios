"use client";
import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../../firebase";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Snackbar,
  Alert,
  Typography,
  Fab,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import CrudStepperDialog from "../components/CrudStepperDialog";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [formData, setFormData] = useState({ name: "", usuario: "", password: "" });
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
    setFormData(employee ? { name: employee.name || "", usuario: employee.usuario || "", password: "" } : { name: "", usuario: "", password: "" });
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
    const toSave = { name: formData.name.trim(), usuario: (formData.usuario || "").trim().toLowerCase() };
    if (formData.password?.trim()) toSave.password = formData.password.trim();

    try {
      if (currentEmployee) {
        await updateDoc(doc(db, "employees", currentEmployee.id), toSave);
        setSnackbar({ open: true, message: "Empleado actualizado correctamente.", severity: "success" });
      } else {
        if (!toSave.usuario) {
          setSnackbar({ open: true, message: "El usuario es obligatorio para poder iniciar sesión.", severity: "error" });
          return;
        }
        if (!formData.password?.trim()) {
          setSnackbar({ open: true, message: "La contraseña es obligatoria para nuevos colaboradores.", severity: "error" });
          return;
        }
        await addDoc(collection(db, "employees"), toSave);
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
                <Typography variant="h6" sx={{ color: "black", mb: 1 }}>
                  {employee.name}
                </Typography>
                {employee.usuario && (
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {employee.usuario}
                  </Typography>
                )}
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

      {/* Dialog con Stepper */}
      <CrudStepperDialog
        open={openDialog}
        onClose={handleCloseDialog}
        title={currentEmployee ? "Editar Colaborador" : "Agregar Colaborador"}
          steps={[
          {
            label: "Datos del colaborador",
            content: (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
                  name="usuario"
                  label="Usuario (para iniciar sesión)"
                  type="text"
                  fullWidth
                  value={formData.usuario}
                  onChange={handleInputChange}
                  required={!currentEmployee}
                  placeholder="ej: jperez"
                />
                <TextField
                  margin="dense"
                  name="password"
                  label={currentEmployee ? "Nueva contraseña (opcional)" : "Contraseña"}
                  type="password"
                  fullWidth
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!currentEmployee}
                />
              </Box>
            ),
          },
        ]}
        onSave={handleSave}
      />

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