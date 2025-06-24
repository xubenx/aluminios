"use client";
import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
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
  Chip,
} from "@mui/material";
import { Add, Edit, Delete, Restore } from "@mui/icons-material";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  status: "available" | "deleted";
}

interface FormData {
  name: string;
  phone: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "warning" | "info";
}

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchText, setSearchText] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<FormData>({ name: "", phone: "" });
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: "", severity: "success" });
  const [showDeleted, setShowDeleted] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    // Filtrar clientes en base al texto de búsqueda y estado
    const filtered = customers.filter((customer) => {
      const matchesSearch = customer.name.toLowerCase().includes(searchText.toLowerCase()) ||
                           (customer.phone && customer.phone.toLowerCase().includes(searchText.toLowerCase()));
      const matchesStatus = showDeleted ? customer.status === "deleted" : customer.status === "available";
      return matchesSearch && matchesStatus;
    });
    setFilteredCustomers(filtered);
  }, [searchText, customers, showDeleted]);
  const fetchCustomers = async () => {
    try {
      const customersSnapshot = await getDocs(collection(db, "customers"));
      const customersData = customersSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "",
          phone: data.phone || "",
          status: (data.status as "available" | "deleted") || "available"
        } as Customer;
      });
      setCustomers(customersData);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setSnackbar({ open: true, message: "Error al cargar los clientes.", severity: "error" });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleOpenDialog = (customer: Customer | null = null) => {
    setCurrentCustomer(customer);
    setFormData(customer ? { name: customer.name, phone: customer.phone || "" } : { name: "", phone: "" });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentCustomer(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setSnackbar({ open: true, message: "El nombre es obligatorio.", severity: "error" });
      return;
    }

    try {
      const customerData = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || "",
        status: "available"
      };

      if (currentCustomer) {
        await updateDoc(doc(db, "customers", currentCustomer.id), customerData);
        setSnackbar({ open: true, message: "Cliente actualizado correctamente.", severity: "success" });
      } else {
        await addDoc(collection(db, "customers"), customerData);
        setSnackbar({ open: true, message: "Cliente agregado correctamente.", severity: "success" });
      }
      fetchCustomers();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving customer:", error);
      setSnackbar({ open: true, message: "Error al guardar el cliente.", severity: "error" });
    }
  };
  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de marcar este cliente como eliminado?")) {
      try {
        await updateDoc(doc(db, "customers", id), { status: "deleted" });
        setSnackbar({ open: true, message: "Cliente marcado como eliminado.", severity: "success" });
        fetchCustomers();
      } catch (error) {
        console.error("Error deleting customer:", error);
        setSnackbar({ open: true, message: "Error al eliminar el cliente.", severity: "error" });
      }
    }
  };

  const handleRestore = async (id: string) => {
    if (confirm("¿Estás seguro de restaurar este cliente?")) {
      try {
        await updateDoc(doc(db, "customers", id), { status: "available" });
        setSnackbar({ open: true, message: "Cliente restaurado correctamente.", severity: "success" });
        fetchCustomers();
      } catch (error) {
        console.error("Error restoring customer:", error);
        setSnackbar({ open: true, message: "Error al restaurar el cliente.", severity: "error" });
      }
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: "black" }}>
        Clientes
      </Typography>

      {/* Controles de filtrado */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", alignItems: "center" }}>
        <TextField
          fullWidth
          label="Buscar Cliente (nombre o teléfono)"
          variant="outlined"
          value={searchText}
          onChange={handleSearchChange}
        />
        <Button
          variant={showDeleted ? "contained" : "outlined"}
          color={showDeleted ? "secondary" : "primary"}
          onClick={() => setShowDeleted(!showDeleted)}
          sx={{ minWidth: "150px" }}
        >
          {showDeleted ? "Ver Activos" : "Ver Eliminados"}
        </Button>
      </div>

      <Paper elevation={3} sx={{ padding: "1rem", marginBottom: "1rem" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Teléfono</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.phone || "Sin teléfono"}</TableCell>
                  <TableCell>
                    <Chip
                      label={customer.status === "available" ? "Disponible" : "Eliminado"}
                      color={customer.status === "available" ? "success" : "error"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {customer.status === "available" ? (
                      <>
                        <Button
                          color="primary"
                          startIcon={<Edit />}
                          onClick={() => handleOpenDialog(customer)}
                          sx={{ marginRight: "0.5rem" }}
                        >
                          Editar
                        </Button>
                        <Button
                          color="secondary"
                          startIcon={<Delete />}
                          onClick={() => handleDelete(customer.id)}
                        >
                          Eliminar
                        </Button>
                      </>
                    ) : (
                      <Button
                        color="success"
                        startIcon={<Restore />}
                        onClick={() => handleRestore(customer.id)}
                      >
                        Restaurar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2" color="textSecondary">
                      {showDeleted ? "No hay clientes eliminados" : "No hay clientes disponibles"}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Botón flotante - solo visible cuando no se muestran eliminados */}
      {!showDeleted && (
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
      )}

      {/* Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{currentCustomer ? "Editar Cliente" : "Agregar Cliente"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Nombre *"
            type="text"
            fullWidth
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          <TextField
            margin="dense"
            name="phone"
            label="Teléfono (opcional)"
            type="tel"
            fullWidth
            value={formData.phone}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} color="primary" variant="contained">
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
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
