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
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Fab,
  Paper,
  Typography,
  Box,
} from "@mui/material";
import CrudStepperDialog from "../components/CrudStepperDialog";
import { Add, Edit, Delete, Calculate } from "@mui/icons-material";
import { useRouter } from "next/navigation";

export default function GlassesPage() {
  const router = useRouter();
  const [glasses, setGlasses] = useState([]);
  const [filteredGlasses, setFilteredGlasses] = useState([]);
  const [inactiveGlasses, setInactiveGlasses] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false); // Confirmación para eliminar
  const [currentGlass, setCurrentGlass] = useState(null);
  const [glassToDelete, setGlassToDelete] = useState(null); // Vidrio a eliminar
  const [formData, setFormData] = useState({
    name: "",
    options: [{ tickness: "", priceCost: "", priceCut: "", priceInstalled: "" }],
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    fetchGlasses();
  }, []);

  useEffect(() => {
    const currentList = showInactive ? inactiveGlasses : glasses;
    const filtered = currentList.filter((glass) =>
      glass.name.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredGlasses(filtered);
  }, [searchText, glasses, inactiveGlasses, showInactive]);

  const fetchGlasses = async () => {
    const glassesSnapshot = await getDocs(collection(db, "glasses"));
    const allGlasses = glassesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    
    const activeGlasses = allGlasses.filter((glass) => glass.status !== "inactive");
    const inactiveGlasses = allGlasses.filter((glass) => glass.status === "inactive");
    
    setGlasses(activeGlasses);
    setFilteredGlasses(activeGlasses);
    setInactiveGlasses(inactiveGlasses);
  };

  // Función para redondear a múltiplos de 5
  const roundToNearestFive = (number) => {
    const rounded = Math.round(number);
    const remainder = rounded % 10;
    
    if (remainder <= 2) {
      return rounded - remainder;
    } else if (remainder <= 7) {
      return rounded - remainder + 5;
    } else {
      return rounded - remainder + 10;
    }
  };

  // Función para calcular precios sugeridos
  const calculateSuggestedPrices = (costPrice) => {
    const cost = parseFloat(costPrice) || 0;
    if (cost <= 0) return { priceCut: "", priceInstalled: "" };

    // Precio al corte: 60% más del costo
    const cutPrice = cost * 1.6;
    const roundedCutPrice = roundToNearestFive(cutPrice);

    // Precio instalado: 100% más del costo (doble)
    const installedPrice = cost * 2;
    const roundedInstalledPrice = roundToNearestFive(installedPrice);

    return {
      priceCut: roundedCutPrice.toString(),
      priceInstalled: roundedInstalledPrice.toString()
    };
  };

  const handleInputChange = (e, index = null, field = null) => {
    if (index !== null && field) {
      const updatedOptions = [...formData.options];
      updatedOptions[index][field] = e.target.value;

      // Si se está editando el precio al costo, calcular automáticamente los otros precios
      if (field === 'priceCost') {
        const suggestedPrices = calculateSuggestedPrices(e.target.value);
        updatedOptions[index].priceCut = suggestedPrices.priceCut;
        updatedOptions[index].priceInstalled = suggestedPrices.priceInstalled;
      }

      setFormData({ ...formData, options: updatedOptions });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleAddOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { tickness: "", priceCost: "", priceCut: "", priceInstalled: "" }],
    });
  };

  const handleRemoveOption = (index) => {
    const updatedOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: updatedOptions });
  };

  const handleOpenDialog = (glass = null) => {
    setCurrentGlass(glass);
    setFormData(
      glass || {
        name: "",
        options: [{ tickness: "", priceCost: "", priceCut: "", priceInstalled: "" }],
      }
    );
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentGlass(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || formData.options.some((opt) => !opt.tickness || !opt.priceCost || !opt.priceCut || !opt.priceInstalled)) {
      setSnackbar({ open: true, message: "Todos los campos son obligatorios y deben ser válidos.", severity: "error" });
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        status: "active", // Asegurar que el vidrio esté marcado como activo
        updatedAt: new Date().toISOString()
      };

      if (currentGlass) {
        await updateDoc(doc(db, "glasses", currentGlass.id), dataToSave);
        setSnackbar({ open: true, message: "Vidrio actualizado correctamente.", severity: "success" });
      } else {
        dataToSave.createdAt = new Date().toISOString();
        await addDoc(collection(db, "glasses"), dataToSave);
        setSnackbar({ open: true, message: "Vidrio agregado correctamente.", severity: "success" });
      }
      fetchGlasses();
      handleCloseDialog();
    } catch (error) {
      console.log(error);
      setSnackbar({ open: true, message: "Error al guardar el vidrio.", severity: "error" });
    }
  };

  const handleDelete = async () => {
    try {
      // En lugar de eliminar, cambiar el status a "inactive"
      await updateDoc(doc(db, "glasses", glassToDelete.id), { 
        status: "inactive",
        deletedAt: new Date().toISOString()
      });
      setSnackbar({ open: true, message: "Vidrio desactivado correctamente.", severity: "success" });
      fetchGlasses();
      setOpenConfirmDialog(false);
    } catch (error) {
      console.log(error);
      setSnackbar({ open: true, message: "Error al desactivar el vidrio.", severity: "error" });
    }
  };

  const handleOpenConfirmDialog = (glass) => {
    setGlassToDelete(glass);
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setGlassToDelete(null);
  };

  // Función para reactivar un vidrio inactivo
  const handleReactivate = async (glass) => {
    try {
      await updateDoc(doc(db, "glasses", glass.id), { 
        status: "active",
        reactivatedAt: new Date().toISOString()
      });
      setSnackbar({ open: true, message: "Vidrio reactivado correctamente.", severity: "success" });
      fetchGlasses();
    } catch (error) {
      console.log(error);
      setSnackbar({ open: true, message: "Error al reactivar el vidrio.", severity: "error" });
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ color: "black" }}>
        Vidrios
      </Typography>

      {/* Botón de Calculadora */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<Calculate />}
          onClick={() => router.push('/sistema/calculadora-vidrios')}
          sx={{
            fontSize: '1.2rem',
            padding: '12px 32px',
            backgroundColor: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.dark',
            }
          }}
        >
          Calculadora de Vidrios
        </Button>
      </Box>

      {/* Buscador y Toggle para inactivos */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <TextField
          fullWidth
          label="Buscar Vidrio"
          variant="outlined"
          margin="normal"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Button
          variant={showInactive ? "contained" : "outlined"}
          color={showInactive ? "warning" : "primary"}
          onClick={() => setShowInactive(!showInactive)}
          sx={{ minWidth: '180px', height: '56px' }}
        >
          {showInactive ? `Inactivos (${inactiveGlasses.length})` : `Activos (${glasses.length})`}
        </Button>
      </Box>

      <Paper elevation={3} sx={{ padding: "1rem", marginBottom: "1rem" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Opciones</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredGlasses.map((glass) => (
                <TableRow key={glass.id} sx={{ opacity: showInactive ? 0.7 : 1 }}>
                  <TableCell>
                    {glass.name}
                    {showInactive && (
                      <Typography variant="caption" sx={{ display: 'block', color: 'warning.main' }}>
                        Desactivado el: {glass.deletedAt ? new Date(glass.deletedAt).toLocaleDateString() : 'N/A'}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "1rem",
                      }}
                    >
                      {glass.options.map((opt, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            backgroundColor: "#f5f5f5",
                            padding: "0.5rem",
                            borderRadius: "8px",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          <Typography variant="body2">
                            <strong>Grosor:</strong> {opt.tickness} mm
                          </Typography>
                          <Typography variant="body2">
                            <strong>Costo:</strong> ${opt.priceCost}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Corte:</strong> ${opt.priceCut}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Instalado:</strong> ${opt.priceInstalled}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {showInactive ? (
                      <Button
                        color="success"
                        startIcon={<Add />}
                        onClick={() => handleReactivate(glass)}
                      >
                        Reactivar
                      </Button>
                    ) : (
                      <>
                        <Button
                          color="azulote"
                          startIcon={<Edit />}
                          onClick={() => handleOpenDialog(glass)}
                          sx={{ marginRight: "0.5rem" }}
                        >
                          Editar
                        </Button>
                        <Button
                          color="warning"
                          startIcon={<Delete />}
                          onClick={() => handleOpenConfirmDialog(glass)}
                        >
                          Desactivar
                        </Button>
                      </>
                    )}
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

      {/* Dialog para CRUD con Stepper */}
      <CrudStepperDialog
        open={openDialog}
        onClose={handleCloseDialog}
        title={currentGlass ? "Editar Vidrio" : "Agregar Vidrio"}
        steps={[
          {
            label: "Información básica",
            content: (
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
            ),
          },
          {
            label: "Variantes de grosor y precios",
            content: (
              <Box>
                {formData.options.map((option, index) => (
                  <Box key={index} sx={{ marginBottom: "1.5rem", padding: "1rem", border: "1px solid #ddd", borderRadius: "8px" }}>
                    <Typography variant="subtitle2" sx={{ marginBottom: "1rem", color: "primary.main" }}>
                      Variante {index + 1}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: 1 }}>
                      <TextField
                        margin="dense"
                        label="Grosor (mm)"
                        type="number"
                        value={option.tickness}
                        onChange={(e) => handleInputChange(e, index, "tickness")}
                        sx={{ flex: 1, minWidth: 120 }}
                      />
                      <TextField
                        margin="dense"
                        label="Precio al Costo"
                        type="number"
                        value={option.priceCost}
                        onChange={(e) => handleInputChange(e, index, "priceCost")}
                        sx={{ flex: 1, minWidth: 120 }}
                        helperText="Los precios de corte e instalado se calculan automáticamente"
                      />
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                      <TextField
                        margin="dense"
                        label="Precio al Corte (Auto: +60%)"
                        type="number"
                        value={option.priceCut}
                        onChange={(e) => handleInputChange(e, index, "priceCut")}
                        sx={{ flex: 1, minWidth: 140 }}
                        InputProps={{ style: { backgroundColor: "#f0f8ff" } }}
                      />
                      <TextField
                        margin="dense"
                        label="Precio Instalado (Auto: +100%)"
                        type="number"
                        value={option.priceInstalled}
                        onChange={(e) => handleInputChange(e, index, "priceInstalled")}
                        sx={{ flex: 1, minWidth: 140 }}
                        InputProps={{ style: { backgroundColor: "#f0f8ff" } }}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          const suggestedPrices = calculateSuggestedPrices(option.priceCost);
                          const updatedOptions = [...formData.options];
                          updatedOptions[index].priceCut = suggestedPrices.priceCut;
                          updatedOptions[index].priceInstalled = suggestedPrices.priceInstalled;
                          setFormData({ ...formData, options: updatedOptions });
                        }}
                        sx={{ minWidth: "100px" }}
                      >
                        Recalcular
                      </Button>
                      <Button
                        color="error"
                        variant="outlined"
                        size="small"
                        onClick={() => handleRemoveOption(index)}
                        sx={{ minWidth: "80px" }}
                      >
                        Eliminar
                      </Button>
                    </Box>
                  </Box>
                ))}
                <Button onClick={handleAddOption} color="azulote" sx={{ mt: 1 }}>
                  Agregar Variante
                </Button>
              </Box>
            ),
          },
        ]}
        onSave={handleSave}
      />

      {/* Dialog de confirmación */}
      <Dialog open={openConfirmDialog} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Confirmar Desactivación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas desactivar este vidrio? 
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            El vidrio no se eliminará permanentemente, solo se ocultará de la lista. 
            Podrás reactivarlo más tarde si es necesario.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancelar</Button>
          <Button onClick={handleDelete} color="warning" variant="contained">
            Desactivar
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