"use client";
import React, { useState, useEffect } from "react";
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
  MenuItem,
  Chip,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import CrudStepperDialog from "../components/CrudStepperDialog";
import { authFetch } from "../../../lib/authFetch";
import { ROLE_LABELS, ROLES } from "../../../lib/roles";

const emptyForm = { name: "", usuario: "", password: "", role: "colaborador" };

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const fetchEmployees = async () => {
    const response = await authFetch("/api/employees");
    const data = await response.json();
    if (!response.ok) {
      setSnackbar({ open: true, message: data.message || "No se pudieron cargar los colaboradores.", severity: "error" });
      return;
    }
    setEmployees(data.employees || []);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenDialog = (employee = null) => {
    setCurrentEmployee(employee);
    setFormData(
      employee
        ? { name: employee.name || "", usuario: employee.usuario || "", password: "", role: employee.role || "colaborador" }
        : emptyForm
    );
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
    if (!currentEmployee && !formData.password.trim()) {
      setSnackbar({ open: true, message: "La contraseña es obligatoria para nuevos colaboradores.", severity: "error" });
      return;
    }

    try {
      const response = await authFetch("/api/employees", {
        method: currentEmployee ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentEmployee?.id,
          name: formData.name,
          usuario: formData.usuario,
          password: formData.password,
          role: formData.role,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setSnackbar({ open: true, message: data.message || "Error al guardar el empleado.", severity: "error" });
        return;
      }
      setSnackbar({
        open: true,
        message: currentEmployee ? "Empleado actualizado correctamente." : "Empleado agregado correctamente.",
        severity: "success",
      });
      fetchEmployees();
      handleCloseDialog();
    } catch {
      setSnackbar({ open: true, message: "Error al guardar el empleado.", severity: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este empleado?")) return;
    try {
      const response = await authFetch("/api/employees", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (!response.ok) {
        setSnackbar({ open: true, message: data.message || "Error al eliminar el empleado.", severity: "error" });
        return;
      }
      setSnackbar({ open: true, message: "Empleado eliminado correctamente.", severity: "success" });
      fetchEmployees();
    } catch {
      setSnackbar({ open: true, message: "Error al eliminar el empleado.", severity: "error" });
    }
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4" align="center" sx={{ mb: 1, color: "black" }}>
        Colaboradores
      </Typography>
      <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 4 }}>
        Administrador: todo el sistema. Auxiliar: oficina, sin cuentas. Colaborador: solo sus órdenes.
      </Typography>

      <Fab
        color="primary"
        aria-label="add"
        onClick={() => handleOpenDialog()}
        sx={{ position: "fixed", bottom: 16, right: 16, zIndex: 1000 }}
      >
        <Add />
      </Fab>

      <Grid container spacing={3}>
        {employees.map((employee) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={employee.id}>
            <Card sx={{ boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: "black", mb: 1 }}>
                  {employee.name}
                </Typography>
                {employee.usuario && (
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    {employee.usuario}
                  </Typography>
                )}
                <Chip
                  size="small"
                  label={ROLE_LABELS[employee.role] || "Sin rol"}
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Button color="primary" startIcon={<Edit />} onClick={() => handleOpenDialog(employee)}>
                    Editar
                  </Button>
                  <Button color="secondary" startIcon={<Delete />} onClick={() => handleDelete(employee.id)}>
                    Eliminar
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

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
                  select
                  margin="dense"
                  name="role"
                  label="Rol"
                  fullWidth
                  value={formData.role}
                  onChange={handleInputChange}
                >
                  {ROLES.map((role) => (
                    <MenuItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </MenuItem>
                  ))}
                </TextField>
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
