"use client";
import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../../../firebase";
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
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
  Alert,  Divider,
  Paper,
  Autocomplete,
  FormControl,
  FormLabel,
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
  Clear
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
  const [projectName, setProjectName] = useState("");
  const [history, setHistory] = useState([]);
  
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
      const glassesData = glassesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
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

  const handleGlassSelection = (glass, option) => {
    setSelectedGlass(glass);
    setSelectedGlassOption(option);
  };
  const calculateGlassArea = () => {
    const height = parseFloat(dimensions.height) || 0;
    const width = parseFloat(dimensions.width) || 0;
    // Convertir de cm a m² (dividir por 100 para cada dimensión)
    return (height / 100) * (width / 100);
  };

  const calculateGlassPrice = () => {
    if (!selectedGlassOption) return 0;
    const area = calculateGlassArea();
    const pricePerUnit = parseFloat(selectedGlassOption[priceType]) || 0;
    return area * pricePerUnit;
  };

  const addToCalculator = () => {
    if (!selectedGlass || !selectedGlassOption) {
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
    const price = calculateGlassPrice();
    const priceTypeText = priceType === "priceInstalled" ? "Instalado" : "Corte";    const newItem = {
      id: Date.now().toString(),
      glassName: selectedGlass.name,
      thickness: selectedGlassOption.tickness,
      dimensions: { ...dimensions },
      area: area,
      priceType: priceTypeText,
      pricePerUnit: parseFloat(selectedGlassOption[priceType]) || 0,
      totalPrice: price,
      timestamp: new Date().toISOString()
    };

    setCalculatorItems(prev => [...prev, newItem]);
    setSnackbar({
      open: true,
      message: "Vidrio agregado al cálculo.",
      severity: "success"
    });    // Limpiar solo las dimensiones, mantener la selección de vidrio
    setDimensions({ height: "25.6", width: "25.6" });
  };

  const removeFromCalculator = (itemId) => {
    setCalculatorItems(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCalculator = () => {
    setCalculatorItems([]);
    resetForm();
  };
  const resetForm = () => {
    setDimensions({ height: "25.6", width: "25.6" });
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
    <Box sx={{ padding: 3, maxWidth: "1400px", margin: "0 auto" }}>      <Typography variant="h4" align="center" sx={{ mb: 3, color: "black" }}>
        <Calculate sx={{ mr: 1, verticalAlign: "middle" }} />
        Calculadora de Vidrios
      </Typography>

      <Grid container spacing={3}>
        {/* Panel de selección */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
              Configuración
            </Typography>            {/* Dimensiones */}
            <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
              <TextField
                label="Alto (cm)"
                type="number"
                value={dimensions.height}
                onChange={(e) => setDimensions({
                  ...dimensions,
                  height: e.target.value
                })}
                inputProps={{ min: "0", step: "0.1" }}
                helperText="Ej: 25.6 = 25cm con 6mm"
              />
              <TextField
                label="Ancho (cm)"
                type="number"
                value={dimensions.width}
                onChange={(e) => setDimensions({
                  ...dimensions,
                  width: e.target.value
                })}
                inputProps={{ min: "0", step: "0.1" }}
                helperText="Ej: 25.6 = 25cm con 6mm"
              />
            </Box>            {/* Tipo de precio */}
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend">Tipo de Precio</FormLabel>
              <RadioGroup
                row
                value={priceType}
                onChange={(e) => setPriceType(e.target.value)}
              >
                <FormControlLabel 
                  value="priceInstalled" 
                  control={<Radio />} 
                  label="Instalado" 
                />
                <FormControlLabel 
                  value="priceCut" 
                  control={<Radio />} 
                  label="Corte" 
                />
              </RadioGroup>
            </FormControl>

            {/* Cálculo actual y botón agregar */}
            {selectedGlass && selectedGlassOption && (
              <Paper sx={{ p: 2, mb: 3, bgcolor: "grey.50", border: "2px solid", borderColor: "primary.main" }}>
                <Typography variant="h6" sx={{ mb: 1, color: "primary.main" }}>
                  Cálculo Actual:
                </Typography>
                <Typography>
                  <strong>Vidrio:</strong> {selectedGlass.name} {selectedGlassOption.tickness}mm
                </Typography>
                <Typography>
                  <strong>Dimensiones:</strong> {dimensions.height} x {dimensions.width} cm
                </Typography>
                <Typography>
                  <strong>Área:</strong> {calculateGlassArea().toFixed(4)} m²
                </Typography>
                <Typography>
                  <strong>Precio por m²:</strong> ${selectedGlassOption[priceType]}
                </Typography>
                <Typography variant="h6" sx={{ color: "primary.main", mt: 1 }}>
                  <strong>Total:</strong> ${calculateGlassPrice().toFixed(2)}
                </Typography>
                
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Add />}
                  onClick={addToCalculator}
                  sx={{ mt: 2, py: 1.5 }}
                  fullWidth
                >
                  Agregar al Cálculo
                </Button>
              </Paper>
            )}            {/* Selección de vidrio */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle1">
                Seleccionar Vidrio:
              </Typography>
              {selectedGlass && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setSelectedGlass(null);
                    setSelectedGlassOption(null);
                  }}
                >
                  Cambiar Vidrio
                </Button>
              )}
            </Box>            
            {!selectedGlass && (
              <Paper sx={{ p: 2, mb: 3, bgcolor: "info.light", color: "info.contrastText" }}>
                <Typography variant="body1" align="center">
                  Selecciona un vidrio para comenzar a calcular
                </Typography>
              </Paper>
            )}

            <Grid container spacing={2}>
              {glasses.map((glass) => (
                <Grid item xs={12} key={glass.id}>
                  <Card variant="outlined" sx={{ 
                    border: selectedGlass?.id === glass.id ? "2px solid" : "1px solid",
                    borderColor: selectedGlass?.id === glass.id ? "primary.main" : "divider"
                  }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 1, color: "black" }}>
                        {glass.name}
                      </Typography>
                      <Grid container spacing={1}>
                        {glass.options.map((option, index) => (
                          <Grid item key={index}>
                            <Chip
                              label={`${option.tickness}mm - $${option[priceType]}`}
                              onClick={() => handleGlassSelection(glass, option)}
                              color={selectedGlassOption?.tickness === option.tickness && 
                                     selectedGlass?.id === glass.id ? "primary" : "default"}
                              variant={selectedGlassOption?.tickness === option.tickness && 
                                      selectedGlass?.id === glass.id ? "filled" : "outlined"}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Panel de resultados */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" sx={{ color: "primary.main" }}>
                Cálculos ({calculatorItems.length})
              </Typography>
              <Box>
                <Button
                  size="small"
                  onClick={clearCalculator}
                  startIcon={<Clear />}
                  sx={{ mr: 1 }}
                >
                  Limpiar
                </Button>
                <Button
                  size="small"
                  onClick={() => setShowHistoryDialog(true)}
                  startIcon={<History />}
                >
                  Historial
                </Button>
              </Box>
            </Box>

            {calculatorItems.length === 0 ? (
              <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                No hay elementos en el cálculo
              </Typography>
            ) : (
              <>
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Vidrio</TableCell>
                        <TableCell>Dimensiones</TableCell>
                        <TableCell>Área</TableCell>
                        <TableCell>Precio</TableCell>
                        <TableCell>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {calculatorItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {item.glassName} {item.thickness}mm
                            <br />
                            <Chip size="small" label={item.priceType} />
                          </TableCell>                          <TableCell>
                            {item.dimensions.height} x {item.dimensions.width} cm
                          </TableCell>
                          <TableCell>
                            {item.area.toFixed(2)} m²
                          </TableCell>
                          <TableCell>
                            ${item.totalPrice.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeFromCalculator(item.id)}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="h6">
                    Área Total: {getTotalArea().toFixed(2)} m²
                  </Typography>
                  <Typography variant="h5" sx={{ color: "primary.main", fontWeight: "bold" }}>
                    Total: ${getTotalPrice().toFixed(2)}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
                  <Button
                    variant="outlined"
                    startIcon={<History />}
                    onClick={saveToHistory}
                    fullWidth
                  >
                    Guardar en Historial
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={() => setShowSaveProjectDialog(true)}
                    fullWidth
                  >
                    Crear Proyecto
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

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
