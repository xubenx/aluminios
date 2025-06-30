"use client";
import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../../../firebase";
import {
  Box,
  Button,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  Paper,
  Autocomplete,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio
} from "@mui/material";
import {
  Add,
  Delete,
  Save,
  History,
  Calculate,
  Clear,
  Edit
} from "@mui/icons-material";

export default function GlassCalculatorPage() {
  // Estados principales
  const [glasses, setGlasses] = useState([]);
  const [selectedGlass, setSelectedGlass] = useState(null);
  const [selectedGlassOption, setSelectedGlassOption] = useState(null);
  const [dimensions, setDimensions] = useState({ height: "", width: "" });
  const [priceType, setPriceType] = useState("priceInstalled"); // priceInstalled o priceCut
  const [calculatorItems, setCalculatorItems] = useState([]);  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  
  // Estados para diálogos
  const [showSaveProjectDialog, setShowSaveProjectDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showChangeGlassDialog, setShowChangeGlassDialog] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [history, setHistory] = useState([]);
  const [itemToEdit, setItemToEdit] = useState(null);
  
  // Estados para clientes
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [createNewCustomer, setCreateNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");

  useEffect(() => {
    fetchGlasses();
    fetchCustomers();
    fetchHistory();
  }, []);

  const fetchGlasses = async () => {
    try {
      const glassesSnapshot = await getDocs(collection(db, "glasses"));
      const glassesData = glassesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(glass => glass.status !== "inactive"); // Solo vidrios activos
      setGlasses(glassesData);
    } catch (error) {
      console.error("Error fetching glasses: ", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const customersSnapshot = await getDocs(collection(db, "customers"));
      const customersData = customersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(customer => customer.status === "available");
      setCustomers(customersData);
    } catch (error) {
      console.error("Error fetching customers: ", error);
    }
  };

  const fetchHistory = async () => {
    try {
      const historySnapshot = await getDocs(collection(db, "history"));
      const historyData = historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Ordenar por fecha más reciente
      const sortedHistory = historyData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setHistory(sortedHistory);
    } catch (error) {
      console.error("Error fetching history: ", error);
    }
  };
  const calculateGlassArea = () => {
    const height = parseFloat(dimensions.height) || 0;
    const width = parseFloat(dimensions.width) || 0;
    // Convertir de cm a m² (dividir por 100 para cada dimensión)
    return (height / 100) * (width / 100);
  };

  const addToCalculator = (glass = selectedGlass, option = selectedGlassOption) => {
    if (!glass || !option) {
      setSnackbar({
        open: true,
        message: "Debe seleccionar un vidrio y una opción.",
        severity: "error"
      });
      return;
    }

    if (!dimensions.height || !dimensions.width || parseFloat(dimensions.height) <= 0 || parseFloat(dimensions.width) <= 0) {
      setSnackbar({
        open: true,
        message: "Las dimensiones deben ser válidas y mayores a 0.",
        severity: "error"
      });
      return;
    }

    const area = calculateGlassArea();
    const price = area * (parseFloat(option[priceType]) || 0);
    const priceTypeText = priceType === "priceInstalled" ? "Instalado" : "Corte";

    const newItem = {
      id: Date.now().toString(),
      glassName: glass.name,
      thickness: option.tickness,
      dimensions: { ...dimensions },
      area: area,
      priceType: priceTypeText,
      pricePerUnit: parseFloat(option[priceType]) || 0,
      totalPrice: price,
      timestamp: new Date().toISOString()
    };

    setCalculatorItems(prev => [...prev, newItem]);
    setSnackbar({
      open: true,
      message: `${glass.name} ${option.tickness}mm agregado al cálculo.`,
      severity: "success"
    });

    // Mantener las dimensiones para facilitar agregar más elementos
  };

  const removeFromCalculator = (itemId) => {
    setCalculatorItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Función para cambiar el vidrio de un elemento existente
  const openChangeGlassDialog = (item) => {
    setItemToEdit(item);
    setShowChangeGlassDialog(true);
  };

  // Función para actualizar un elemento con nuevo vidrio/opción
  const updateCalculatorItem = (newGlass, newOption) => {
    if (!itemToEdit || !newGlass || !newOption) return;

    const area = (parseFloat(itemToEdit.dimensions.height) / 100) * (parseFloat(itemToEdit.dimensions.width) / 100);
    const price = area * (parseFloat(newOption[priceType]) || 0);
    const priceTypeText = priceType === "priceInstalled" ? "Instalado" : "Corte";

    const updatedItem = {
      ...itemToEdit,
      glassName: newGlass.name,
      thickness: newOption.tickness,
      priceType: priceTypeText,
      pricePerUnit: parseFloat(newOption[priceType]) || 0,
      totalPrice: price,
      timestamp: new Date().toISOString()
    };

    setCalculatorItems(prev => prev.map(item => 
      item.id === itemToEdit.id ? updatedItem : item
    ));

    setSnackbar({
      open: true,
      message: `Elemento actualizado a ${newGlass.name} ${newOption.tickness}mm.`,
      severity: "success"
    });

    setShowChangeGlassDialog(false);
    setItemToEdit(null);
  };

  const clearCalculator = () => {
    setCalculatorItems([]);
    resetForm();
  };
  const resetForm = () => {
    setDimensions({ height: "", width: "" });
    setSelectedGlass(null);
    setSelectedGlassOption(null);
  };

  const getTotalArea = () => {
    return calculatorItems.reduce((total, item) => total + item.area, 0);
  };

  const getTotalPrice = () => {
    return calculatorItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  const saveToHistory = async () => {
    if (calculatorItems.length === 0) {
      setSnackbar({
        open: true,
        message: "No hay elementos para guardar en el historial.",
        severity: "error"
      });
      return;
    }

    try {
      const historyData = {
        items: calculatorItems,
        totalArea: getTotalArea(),
        totalPrice: getTotalPrice(),
        createdAt: new Date().toISOString(),
        type: "glass_calculation"
      };

      await addDoc(collection(db, "history"), historyData);
      setSnackbar({
        open: true,
        message: "Cálculo guardado en el historial.",
        severity: "success"
      });
      fetchHistory();
    } catch (error) {
      console.error("Error saving to history: ", error);
      setSnackbar({
        open: true,
        message: "Error al guardar en el historial.",
        severity: "error"
      });
    }
  };

  const saveAsProject = async () => {
    if (!projectName.trim()) {
      setSnackbar({
        open: true,
        message: "El nombre del proyecto es obligatorio.",
        severity: "error"
      });
      return;
    }

    if (calculatorItems.length === 0) {
      setSnackbar({
        open: true,
        message: "No hay elementos para crear el proyecto.",
        severity: "error"
      });
      return;
    }

    let finalCustomerId = null;

    try {
      // Si se va a crear un nuevo cliente
      if (createNewCustomer) {
        if (!newCustomerName.trim()) {
          setSnackbar({
            open: true,
            message: "El nombre del cliente es obligatorio.",
            severity: "error"
          });
          return;
        }

        const customerData = {
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim() || "",
          status: "available"
        };

        const customerDoc = await addDoc(collection(db, "customers"), customerData);
        finalCustomerId = customerDoc.id;
      } else if (selectedCustomer) {
        finalCustomerId = selectedCustomer.id;
      } else {
        setSnackbar({
          open: true,
          message: "Debe seleccionar un cliente o crear uno nuevo.",
          severity: "error"
        });
        return;
      }

      // Crear el proyecto
      const projectData = {
        name: projectName.trim(),
        customerId: finalCustomerId,
        customerName: createNewCustomer ? newCustomerName.trim() : selectedCustomer.name,
        items: calculatorItems.map(item => ({
          modelId: "glass-calculator",
          modelName: `${item.glassName} ${item.thickness}mm`,
          dimensions: item.dimensions,
          selectedGlass: {
            name: `${item.glassName} ${item.thickness}mm`,
            priceInstalled: item.pricePerUnit
          },
          total: item.totalPrice,
          area: item.area || "",
          status: "cotizacion",
          laborCostSelected: 0,
          details: {
            materials: { price: 0, items: [] },
            chapes: { price: 0, items: [] },
            glasses: { 
              price: item.totalPrice, 
              items: [{
                name: `${item.glassName} ${item.thickness}mm`,
                meterage: item.area,
                price: item.totalPrice
              }]
            },
            laborCost: 0
          }
        })),
        total: getTotalPrice(),
        createdAt: new Date().toISOString(),
        status: "quotation",
        type: "glass_project"
      };

      await addDoc(collection(db, "projects"), projectData);

      // Guardar también en el historial
      await saveToHistory();

      setSnackbar({
        open: true,
        message: "Proyecto creado exitosamente.",
        severity: "success"
      });

      // Limpiar estados
      setProjectName("");
      setSelectedCustomer(null);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setCreateNewCustomer(false);
      setShowSaveProjectDialog(false);
      clearCalculator();

    } catch (error) {
      console.error("Error saving project: ", error);
      setSnackbar({
        open: true,
        message: "Error al crear el proyecto.",
        severity: "error"
      });
    }
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header fijo */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
        <Typography variant="h5" align="center" sx={{ color: "black", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Calculate sx={{ mr: 1 }} />
          Calculadora de Vidrios
        </Typography>
      </Box>

      {/* Panel de configuración compacto fijo */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider", bgcolor: "grey.50" }}>
        <Box sx={{ display: "flex", gap: 3, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
          {/* Dimensiones */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Typography variant="body2" sx={{ minWidth: "40px" }}>Alto:</Typography>
            <TextField
              size="small"
              type="number"
              value={dimensions.height}
              onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
              inputProps={{ min: "0", step: "0.1" }}
              sx={{ width: "80px" }}
            />
            <Typography variant="body2">cm</Typography>
          </Box>
          
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Typography variant="body2" sx={{ minWidth: "50px" }}>Ancho:</Typography>
            <TextField
              size="small"
              type="number"
              value={dimensions.width}
              onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
              inputProps={{ min: "0", step: "0.1" }}
              sx={{ width: "80px" }}
            />
            <Typography variant="body2">cm</Typography>
          </Box>

          {/* Tipo de precio */}
          <FormControl component="fieldset">
            <RadioGroup
              row
              value={priceType}
              onChange={(e) => setPriceType(e.target.value)}
              sx={{ gap: 2 }}
            >
              <FormControlLabel 
                value="priceInstalled" 
                control={<Radio size="small" />} 
                label="Instalado"
                sx={{ margin: 0 }}
              />
              <FormControlLabel 
                value="priceCut" 
                control={<Radio size="small" />} 
                label="Corte"
                sx={{ margin: 0 }}
              />
            </RadioGroup>
          </FormControl>

          {/* Área calculada */}
          <Typography variant="body2" sx={{ color: "primary.main", fontWeight: "bold" }}>
            Área: {calculateGlassArea().toFixed(2)} m²
          </Typography>

          <Button
            size="small"
            onClick={clearCalculator}
            startIcon={<Clear />}
            variant="outlined"
            color="error"
          >
            Limpiar Todo
          </Button>
        </Box>
      </Box>

      {/* Contenido principal con scroll */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Panel izquierdo - Selección de vidrios */}
        <Box sx={{ 
          width: "60%", 
          borderRight: 1, 
          borderColor: "divider", 
          display: "flex", 
          flexDirection: "column",
          overflow: "hidden"
        }}>
          {/* Lista de vidrios */}
          <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "primary.main", sticky: "top" }}>
              Seleccionar Vidrio
            </Typography>
            
            {glasses.map((glass) => (
              <Paper 
                key={glass.id} 
                sx={{ 
                  mb: 2, 
                  p: 2,
                  cursor: "pointer",
                  border: selectedGlass?.id === glass.id ? 2 : 1,
                  borderColor: selectedGlass?.id === glass.id ? "primary.main" : "divider",
                  bgcolor: selectedGlass?.id === glass.id ? "primary.light" : "background.paper",
                  transition: "all 0.2s",
                  "&:hover": {
                    bgcolor: selectedGlass?.id === glass.id ? "primary.light" : "grey.50",
                    transform: "translateY(-1px)",
                    boxShadow: 2
                  }
                }}
                onClick={() => {
                  setSelectedGlass(selectedGlass?.id === glass.id ? null : glass);
                  setSelectedGlassOption(null);
                }}
              >
                <Typography variant="h6" sx={{ color: selectedGlass?.id === glass.id ? "primary.contrastText" : "text.primary" }}>
                  {glass.name}
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: selectedGlass?.id === glass.id ? "primary.contrastText" : "text.secondary",
                  opacity: 0.8 
                }}>
                  {glass.options.length} opción{glass.options.length !== 1 ? 'es' : ''} disponible{glass.options.length !== 1 ? 's' : ''}
                </Typography>
              </Paper>
            ))}
          </Box>

          {/* Panel de opciones (solo si hay vidrio seleccionado) */}
          {selectedGlass && (
            <Box sx={{ 
              borderTop: 1, 
              borderColor: "divider", 
              p: 2, 
              bgcolor: "background.paper",
              maxHeight: "80%",
              overflow: "auto"
            }}>
              <Typography variant="subtitle1" sx={{ mb: 2, color: "primary.main" }}>
                Opciones de {selectedGlass.name}
              </Typography>
              
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {selectedGlass.options.map((option, index) => {
                  const price = parseFloat(option[priceType]) || 0;
                  const totalPrice = calculateGlassArea() * price;
                  const isValidDimensions = parseFloat(dimensions.height) > 0 && parseFloat(dimensions.width) > 0;
                  
                  return (
                    <Paper
                      key={index}
                      sx={{
                        p: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        border: 1,
                        borderColor: "divider",
                        bgcolor: !isValidDimensions ? "grey.100" : "background.paper",
                        opacity: !isValidDimensions ? 0.6 : 1
                      }}
                    >
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                          Grosor: {option.tickness}mm
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ${price.toFixed(2)}/m² = ${isValidDimensions ? totalPrice.toFixed(2) : "0.00"}
                        </Typography>
                      </Box>
                      
                      <Button
                        variant="contained"
                        size="small"
                        disabled={!isValidDimensions}
                        onClick={() => {
                          setSelectedGlassOption(option);
                          addToCalculator(selectedGlass, option);
                        }}
                        startIcon={<Add />}
                        sx={{ minWidth: "100px" }}
                      >
                        Agregar
                      </Button>
                    </Paper>
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>

        {/* Panel derecho - Sumatoria */}
        <Box sx={{ 
          width: "40%", 
          display: "flex", 
          flexDirection: "column",
          overflow: "hidden"
        }}>
          {/* Header del panel de sumatoria */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h6" sx={{ color: "primary.main" }}>
                Sumatoria ({calculatorItems.length})
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  onClick={() => setShowHistoryDialog(true)}
                  startIcon={<History />}
                  variant="outlined"
                >
                  Historial
                </Button>
                {calculatorItems.length > 0 && (
                  <>
                    <Button
                      size="small"
                      onClick={saveToHistory}
                      startIcon={<History />}
                      variant="outlined"
                    >
                      Guardar
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setShowSaveProjectDialog(true)}
                      startIcon={<Save />}
                      variant="contained"
                    >
                      Proyecto
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Box>

          {/* Lista de elementos agregados */}
          <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
            {calculatorItems.length === 0 ? (
              <Box sx={{ 
                textAlign: "center", 
                py: 4, 
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                border: "2px dashed",
                borderColor: "grey.300",
                borderRadius: 2,
                bgcolor: "grey.50"
              }}>
                <Typography color="textSecondary" variant="h6" sx={{ mb: 1 }}>
                  Sin elementos
                </Typography>
                <Typography color="textSecondary" variant="body2">
                  Selecciona un vidrio y agrégalo para empezar
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {calculatorItems.map((item) => (
                  <Paper
                    key={item.id}
                    sx={{
                      p: 2,
                      border: 1,
                      borderColor: "divider",
                      "&:hover": {
                        boxShadow: 2
                      }
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: "medium", mb: 0.5 }}>
                          {item.glassName}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                          <Chip size="small" label={`${item.thickness}mm`} variant="outlined" />
                          <Chip size="small" label={item.priceType} color="primary" />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {item.dimensions.height} × {item.dimensions.width} cm
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.area.toFixed(2)} m²
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "right", ml: 2 }}>
                        <Typography variant="h6" sx={{ color: "primary.main", fontWeight: "bold" }}>
                          ${item.totalPrice.toFixed(2)}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 0.5, mt: 1 }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => openChangeGlassDialog(item)}
                            title="Cambiar vidrio"
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeFromCalculator(item.id)}
                            title="Eliminar"
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>

          {/* Panel de totales fijo en la parte inferior */}
          {calculatorItems.length > 0 && (
            <Box sx={{ 
              p: 2, 
              borderTop: 1, 
              borderColor: "divider", 
              bgcolor: "primary.main",
              color: "primary.contrastText"
            }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="h6">
                    Área Total: {getTotalArea().toFixed(2)} m²
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    {calculatorItems.length} elemento{calculatorItems.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                  ${getTotalPrice().toFixed(2)}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Diálogo para guardar proyecto */}
      <Dialog open={showSaveProjectDialog} onClose={() => setShowSaveProjectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Guardar como Proyecto</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre del Proyecto"
            fullWidth
            variant="outlined"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ mb: 2 }}>
            <Button
              variant={createNewCustomer ? "outlined" : "contained"}
              onClick={() => setCreateNewCustomer(false)}
              sx={{ mr: 1 }}
            >
              Cliente Existente
            </Button>
            <Button
              variant={createNewCustomer ? "contained" : "outlined"}
              onClick={() => setCreateNewCustomer(true)}
            >
              Nuevo Cliente
            </Button>
          </Box>

          {createNewCustomer ? (
            <>
              <TextField
                margin="dense"
                label="Nombre del Cliente"
                fullWidth
                variant="outlined"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Teléfono del Cliente (opcional)"
                fullWidth
                variant="outlined"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
              />
            </>
          ) : (
            <Autocomplete
              options={customers}
              getOptionLabel={(option) => `${option.name}${option.phone ? ` - ${option.phone}` : ''}`}
              value={selectedCustomer}
              onChange={(event, newValue) => setSelectedCustomer(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Seleccionar Cliente" variant="outlined" />
              )}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveProjectDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={saveAsProject}>
            Crear Proyecto
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de historial */}
      <Dialog open={showHistoryDialog} onClose={() => setShowHistoryDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Historial de Cálculos</DialogTitle>
        <DialogContent>
          {history.length === 0 ? (
            <Typography>No hay historial disponible</Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Elementos</TableCell>
                    <TableCell>Área Total</TableCell>
                    <TableCell>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {new Date(record.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>{record.items?.length || 0}</TableCell>
                      <TableCell>{record.totalArea?.toFixed(2) || 0} m²</TableCell>
                      <TableCell>${record.totalPrice?.toFixed(2) || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistoryDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para cambiar vidrio de elemento */}
      <Dialog open={showChangeGlassDialog} onClose={() => setShowChangeGlassDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cambiar Vidrio de Elemento</DialogTitle>
        <DialogContent>
          {itemToEdit && (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2, color: "primary.main" }}>
                {itemToEdit.glassName} - {itemToEdit.thickness}mm
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                Seleccione un nuevo vidrio y opción:
              </Typography>

              {/* Lista de vidrios disponibles */}
              <Box sx={{ maxHeight: "300px", overflow: "auto", mb: 2 }}>
                {glasses.map((glass) => (
                  <Paper 
                    key={glass.id} 
                    sx={{ 
                      mb: 1, 
                      p: 2,
                      cursor: "pointer",
                      border: selectedGlass?.id === glass.id ? 2 : 1,
                      borderColor: selectedGlass?.id === glass.id ? "primary.main" : "divider",
                      bgcolor: selectedGlass?.id === glass.id ? "primary.light" : "background.paper",
                      transition: "all 0.2s",
                      "&:hover": {
                        bgcolor: selectedGlass?.id === glass.id ? "primary.light" : "grey.50",
                        transform: "translateY(-1px)",
                        boxShadow: 2
                      }
                    }}
                    onClick={() => {
                      setSelectedGlass(glass);
                      setSelectedGlassOption(glass.options[0]); // Seleccionar la primera opción por defecto
                    }}
                  >
                    <Typography variant="h6" sx={{ color: selectedGlass?.id === glass.id ? "primary.contrastText" : "text.primary" }}>
                      {glass.name}
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: selectedGlass?.id === glass.id ? "primary.contrastText" : "text.secondary",
                      opacity: 0.8 
                    }}>
                      {glass.options.length} opción{glass.options.length !== 1 ? 'es' : ''} disponible{glass.options.length !== 1 ? 's' : ''}
                    </Typography>
                  </Paper>
                ))}
              </Box>

              {/* Opciones del vidrio seleccionado */}
              {selectedGlass && (
                <Box sx={{ 
                  borderTop: 1, 
                  borderColor: "divider", 
                  p: 2, 
                  bgcolor: "background.paper",
                  maxHeight: "300px",
                  overflow: "auto"
                }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, color: "primary.main" }}>
                    Opciones de {selectedGlass.name}
                  </Typography>
                  
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {selectedGlass.options.map((option, index) => {
                      const price = parseFloat(option[priceType]) || 0;
                      const totalPrice = calculateGlassArea() * price;
                      const isValidDimensions = parseFloat(dimensions.height) > 0 && parseFloat(dimensions.width) > 0;
                      
                      return (
                        <Paper
                          key={index}
                          sx={{
                            p: 2,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            border: 1,
                            borderColor: "divider",
                            bgcolor: !isValidDimensions ? "grey.100" : "background.paper",
                            opacity: !isValidDimensions ? 0.6 : 1
                          }}
                        >
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                              Grosor: {option.tickness}mm
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              ${price.toFixed(2)}/m² = ${isValidDimensions ? totalPrice.toFixed(2) : "0.00"}
                            </Typography>
                          </Box>
                          
                          <Button
                            variant="contained"
                            size="small"
                            disabled={!isValidDimensions}
                            onClick={() => {
                              setSelectedGlassOption(option);
                              updateCalculatorItem(selectedGlass, option);
                            }}
                            startIcon={<Add />}
                            sx={{ minWidth: "100px" }}
                          >
                            Cambiar
                          </Button>
                        </Paper>
                      );
                    })}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowChangeGlassDialog(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para cambiar vidrio */}
      <Dialog open={showChangeGlassDialog} onClose={() => setShowChangeGlassDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Cambiar Vidrio - {itemToEdit?.dimensions.height} × {itemToEdit?.dimensions.width} cm
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Elemento actual: {itemToEdit?.glassName} {itemToEdit?.thickness}mm - ${itemToEdit?.totalPrice.toFixed(2)}
          </Typography>
          
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: "60vh", overflow: "auto" }}>
            {glasses.map((glass) => (
              <Paper key={glass.id} sx={{ p: 2, border: 1, borderColor: "divider" }}>
                <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
                  {glass.name}
                </Typography>
                
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {glass.options.map((option, index) => {
                    if (!itemToEdit) return null;
                    
                    const area = (parseFloat(itemToEdit.dimensions.height) / 100) * (parseFloat(itemToEdit.dimensions.width) / 100);
                    const price = parseFloat(option[priceType]) || 0;
                    const totalPrice = area * price;
                    const currentSelection = itemToEdit.glassName === glass.name && itemToEdit.thickness === option.tickness;
                    
                    return (
                      <Paper
                        key={index}
                        sx={{
                          p: 2,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          border: 1,
                          borderColor: currentSelection ? "primary.main" : "divider",
                          bgcolor: currentSelection ? "primary.light" : "background.paper"
                        }}
                      >
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                            Grosor: {option.tickness}mm
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ${price.toFixed(2)}/m² = ${totalPrice.toFixed(2)}
                          </Typography>
                          {currentSelection && (
                            <Chip size="small" label="Actual" color="primary" sx={{ mt: 0.5 }} />
                          )}
                        </Box>
                        
                        <Button
                          variant={currentSelection ? "outlined" : "contained"}
                          size="small"
                          disabled={currentSelection}
                          onClick={() => updateCalculatorItem(glass, option)}
                          sx={{ minWidth: "100px" }}
                        >
                          {currentSelection ? "Actual" : "Cambiar"}
                        </Button>
                      </Paper>
                    );
                  })}
                </Box>
              </Paper>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowChangeGlassDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

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
