"use client";
import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../../../../firebase";
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Chip,
  Snackbar,
  Alert,
  Fab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import CrudStepperDialog from "../components/CrudStepperDialog";
import {
  Add,
  Edit,
  Delete,
  NotificationImportant,
  Schedule,
  CheckCircle,
  Warning
} from "@mui/icons-material";

export default function RecordatoriosPage() {
  const [reminders, setReminders] = useState([]);
  const [filteredReminders, setFilteredReminders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Estados para CRUD
  const [openDialog, setOpenDialog] = useState(false);
  const [currentReminder, setCurrentReminder] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    date: new Date().toISOString().split('T')[0], // Fecha actual
    status: "Pendiente"
  });
  
  // Estados para mensajes
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    fetchReminders();
  }, []);

  useEffect(() => {
    let filtered = reminders.filter(reminder => {
      // Filtrar por búsqueda
      const matchesSearch = reminder.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          reminder.descripcion.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filtrar por estado
      const matchesStatus = filterStatus === "all" || reminder.status === filterStatus;
      
      return matchesSearch && matchesStatus && reminder.status !== "Borrado";
    });

    // Ordenar por urgencia (días desde creación) y estado
    const sortedReminders = filtered.sort((a, b) => {
      // Primero por estado: Pendiente > Revisado > otros
      const statusOrder = { "Pendiente": 0, "Revisado": 1 };
      const statusA = statusOrder[a.status] !== undefined ? statusOrder[a.status] : 2;
      const statusB = statusOrder[b.status] !== undefined ? statusOrder[b.status] : 2;
      
      if (statusA !== statusB) {
        return statusA - statusB;
      }
      
      // Luego por días transcurridos (más días = más urgente)
      const getDaysFromDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const diffTime = today - date;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      };
      
      const daysA = getDaysFromDate(a.date);
      const daysB = getDaysFromDate(b.date);
      
      return daysB - daysA; // Más días primero
    });
    
    setFilteredReminders(sortedReminders);
  }, [searchQuery, filterStatus, reminders]);

  const fetchReminders = async () => {
    try {
      const remindersSnapshot = await getDocs(collection(db, "reminders"));
      const remindersData = remindersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReminders(remindersData);
    } catch (error) {
      console.error("Error fetching reminders: ", error);
      setSnackbar({
        open: true,
        message: "Error al cargar los recordatorios.",
        severity: "error"
      });
    }
  };

  const handleOpenDialog = (reminder = null) => {
    setCurrentReminder(reminder);
    if (reminder) {
      setFormData({
        nombre: reminder.nombre,
        descripcion: reminder.descripcion,
        date: reminder.date,
        status: reminder.status
      });
    } else {
      setFormData({
        nombre: "",
        descripcion: "",
        date: new Date().toISOString().split('T')[0],
        status: "Pendiente"
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentReminder(null);
  };

  const handleSave = async () => {
    if (!formData.nombre.trim() || !formData.descripcion.trim()) {
      setSnackbar({
        open: true,
        message: "El nombre y la descripción son obligatorios.",
        severity: "error"
      });
      return;
    }

    try {
      const reminderData = {
        ...formData,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        updatedAt: new Date().toISOString()
      };

      if (currentReminder) {
        await updateDoc(doc(db, "reminders", currentReminder.id), reminderData);
        setSnackbar({
          open: true,
          message: "Recordatorio actualizado exitosamente.",
          severity: "success"
        });
      } else {
        await addDoc(collection(db, "reminders"), {
          ...reminderData,
          createdAt: new Date().toISOString()
        });
        setSnackbar({
          open: true,
          message: "Recordatorio creado exitosamente.",
          severity: "success"
        });
      }
      
      fetchReminders();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving reminder: ", error);
      setSnackbar({
        open: true,
        message: "Error al guardar el recordatorio.",
        severity: "error"
      });
    }
  };

  const handleDelete = async (reminderId) => {
    if (window.confirm("¿Está seguro de que desea marcar este recordatorio como borrado?")) {
      try {
        await updateDoc(doc(db, "reminders", reminderId), {
          status: "Borrado",
          deletedAt: new Date().toISOString()
        });
        setSnackbar({
          open: true,
          message: "Recordatorio marcado como borrado.",
          severity: "success"
        });
        fetchReminders();
      } catch (error) {
        console.error("Error deleting reminder: ", error);
        setSnackbar({
          open: true,
          message: "Error al borrar el recordatorio.",
          severity: "error"
        });
      }
    }
  };

  const handleStatusChange = async (reminderId, newStatus) => {
    try {
      await updateDoc(doc(db, "reminders", reminderId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      setSnackbar({
        open: true,
        message: `Estado cambiado a ${newStatus}.`,
        severity: "success"
      });
      fetchReminders();
    } catch (error) {
      console.error("Error updating status: ", error);
      setSnackbar({
        open: true,
        message: "Error al cambiar el estado.",
        severity: "error"
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pendiente': return 'warning';
      case 'Revisado': return 'info';
      case 'Borrado': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pendiente': return <Schedule />;
      case 'Revisado': return <CheckCircle />;
      case 'Borrado': return <Delete />;
      default: return <NotificationImportant />;
    }
  };

  const getDaysFromDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = today - date;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getUrgencyLevel = (days, status) => {
    if (status === "Borrado") return null;
    if (days >= 7) return "high";
    if (days >= 3) return "medium";
    return "low";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Box sx={{ padding: 3, maxWidth: "1400px", margin: "0 auto" }}>
      <Typography variant="h4" align="center" sx={{ mb: 3, color: "black" }}>
        <NotificationImportant sx={{ mr: 1, verticalAlign: "middle" }} />
        Recordatorios
      </Typography>

      {/* Barra de búsqueda y filtros */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Buscar recordatorios"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
        />
        
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filtrar por Estado</InputLabel>
          <Select
            value={filterStatus}
            label="Filtrar por Estado"
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="Pendiente">Pendiente</MenuItem>
            <MenuItem value="Revisado">Revisado</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Lista de recordatorios */}
      <Grid container spacing={3}>
        {filteredReminders.map((reminder) => {
          const days = getDaysFromDate(reminder.date);
          const urgencyLevel = getUrgencyLevel(days, reminder.status);
          
          return (
            <Grid item xs={12} sm={6} lg={4} key={reminder.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                border: urgencyLevel === 'high' ? '2px solid #f44336' : 
                        urgencyLevel === 'medium' ? '2px solid #ff9800' : 
                        '1px solid rgba(0, 0, 0, 0.12)',
                boxShadow: urgencyLevel === 'high' ? 3 : 1
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" sx={{ color: "black", fontWeight: 'bold' }}>
                      {reminder.nombre}
                      {urgencyLevel === 'high' && (
                        <Warning sx={{ ml: 1, color: 'error.main', verticalAlign: 'middle' }} />
                      )}
                    </Typography>
                    <Chip 
                      icon={getStatusIcon(reminder.status)}
                      label={reminder.status} 
                      color={getStatusColor(reminder.status)}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {reminder.descripcion}
                  </Typography>

                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    <strong>Fecha:</strong> {formatDate(reminder.date)}
                  </Typography>

                  <Typography variant="body2" sx={{ 
                    mb: 2, 
                    color: urgencyLevel === 'high' ? 'error.main' : 
                           urgencyLevel === 'medium' ? 'warning.main' : 'textSecondary'
                  }}>
                    <strong>Días transcurridos:</strong> {days} días
                  </Typography>

                  {/* Botones de acción */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={() => handleOpenDialog(reminder)}
                    >
                      Editar
                    </Button>
                    
                    {reminder.status === "Pendiente" && (
                      <Button
                        size="small"
                        variant="contained"
                        color="info"
                        onClick={() => handleStatusChange(reminder.id, "Revisado")}
                      >
                        Marcar Revisado
                      </Button>
                    )}
                    
                    {reminder.status === "Revisado" && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        onClick={() => handleStatusChange(reminder.id, "Pendiente")}
                      >
                        Marcar Pendiente
                      </Button>
                    )}
                    
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => handleDelete(reminder.id)}
                    >
                      Borrar
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {filteredReminders.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            {searchQuery || filterStatus !== "all" ? 'No se encontraron recordatorios con ese criterio' : 'No hay recordatorios disponibles'}
          </Typography>
        </Box>
      )}

      {/* Botón flotante para agregar */}
      <Fab
        color="primary"
        aria-label="add reminder"
        onClick={() => handleOpenDialog()}
        sx={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
        }}
      >
        <Add />
      </Fab>

      {/* Diálogo para CRUD con Stepper */}
      <CrudStepperDialog
        open={openDialog}
        onClose={handleCloseDialog}
        title={currentReminder ? "Editar Recordatorio" : "Nuevo Recordatorio"}
        saveLabel={currentReminder ? "Actualizar" : "Crear"}
        steps={[
          {
            label: "Información del recordatorio",
            content: (
              <>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Nombre"
                  fullWidth
                  variant="outlined"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  sx={{ mb: 2 }}
                />
                <TextField
                  margin="dense"
                  label="Descripción"
                  fullWidth
                  variant="outlined"
                  multiline
                  rows={4}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </>
            ),
          },
          {
            label: "Fecha y estado",
            content: (
              <>
                <TextField
                  margin="dense"
                  label="Fecha"
                  type="date"
                  fullWidth
                  variant="outlined"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  sx={{ mb: 2 }}
                  InputLabelProps={{ shrink: true }}
                />
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    label="Estado"
                  >
                    <MenuItem value="Pendiente">Pendiente</MenuItem>
                    <MenuItem value="Revisado">Revisado</MenuItem>
                  </Select>
                </FormControl>
              </>
            ),
          },
        ]}
        onSave={handleSave}
      />

      {/* Snackbar para mensajes */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
